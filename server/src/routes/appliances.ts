import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

// Appliance faults. A supervisor reports a broken machine during their shift,
// and a manager marks it fixed later. Counting the ones still open is what the
// dashboard tile will use.

const router = Router();
router.use(requireAuth);


// Supervisor reports a fault on their running shift
router.post('/', requireRole('supervisor'), async (req, res) => {
  try {
    const { appliance, description } = req.body;
    // Only two fields on this screen.

    if (!appliance || String(appliance).trim() === '') {
      return res.status(400).json({ error: 'Appliance name is required' });
    }
    // Without knowing which machine broke, the record is useless.

    // Find the shift that's still running for this user
    const shiftResult = await pool.query(
      'SELECT id FROM shifts WHERE user_id = $1 AND ended_at IS NULL',
      [req.user!.id]
    );
    const shift = shiftResult.rows[0];
    // Same lookup as incidents - a fault belongs to the night it happened on.

    if (!shift) {
      return res.status(409).json({ error: 'Start a shift before reporting an appliance issue' });
    }

    const result = await pool.query(
      `INSERT INTO appliance_issues (shift_id, appliance, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [shift.id, appliance, description ?? '', req.user!.id]
    );
    // I don't pass status. The table defaults it to 'open', which is right for
    // every new fault.

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Mark a fault fixed, or put it back to open
router.patch('/:id', requireRole('manager', 'administrator'), async (req, res) => {
  // PATCH means "change part of this". The :id in the path is a placeholder, so
  // PATCH /appliances/abc-123 puts "abc-123" into req.params.id.
  try {
    const { status } = req.body;

    if (status !== 'open' && status !== 'fixed') {
      return res.status(400).json({ error: "Status must be 'open' or 'fixed'" });
    }
    // Only two words allowed, same as the CHECK on the table.

    const result = await pool.query(
      `UPDATE appliance_issues
         SET status = $1,
             resolved_at = CASE WHEN $1 = 'fixed' THEN now() ELSE NULL END
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );
    // CASE WHEN is an if-statement inside SQL. Marking it fixed stamps the time,
    // reopening clears it. I'm doing both in one statement so the two columns
    // can never disagree.

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appliance issue not found' });
    }
    // Nothing updated, so that id doesn't exist. Without this check the app
    // would get a success response for a fault I never touched.

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Managers and administrators can list faults. ?status=open for just the open ones.
router.get('/', requireRole('manager', 'administrator'), async (req, res) => {
  try {
    const onlyOpen = req.query.status === 'open';
    // Read the bit after the ? in the URL. true or false.

    const result = await pool.query(
      `SELECT a.id, a.appliance, a.description, a.status, a.created_at, a.resolved_at,
              u.name AS reported_by
       FROM appliance_issues a
       JOIN users u ON u.id = a.created_by
       WHERE ($1 = false OR a.status = 'open')
       ORDER BY a.created_at DESC`,
      [onlyOpen]
    );
    // That WHERE line is a filter I can switch off. When onlyOpen is false the
    // first half is true so every row passes; when it's true the row has to be
    // open. One query instead of two.

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
