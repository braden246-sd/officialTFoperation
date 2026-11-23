import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

// Incident reports. A supervisor records one while their shift is still
// running, so it ties to that shift and to them. Managers can read the list.

const router = Router();
router.use(requireAuth);
// Everything below needs a valid login. No token means 401 and my code never
// runs.


// Supervisor reports an incident on their running shift
router.post('/', requireRole('supervisor'), async (req, res) => {
  // POST '/' is the path after the mount point, so this ends up as
  // POST /incidents. requireRole runs first - a manager's token gets 403 here
  // and the handler never runs.
  try {
    const { title, description, location, peopleInvolved, severity } = req.body;
    // Pull the five fields out of the JSON the app sent.

    if (!description || String(description).trim() === '') {
      return res.status(400).json({ error: 'Description is required' });
    }
    // Description is the one field I insist on. trim() means a box with only
    // spaces counts as empty. 400 means "you sent bad data". I return here, or
    // the code would carry on and try to send a second response.

    const level = ['low', 'medium', 'high'].includes(severity) ? severity : 'low';
    // The screen has no severity picker yet, so anything unexpected becomes
    // 'low'. This also stops junk reaching the database - the CHECK would
    // reject it anyway, but that comes back as an ugly 500.

    // Find the shift that's still running for this user
    const shiftResult = await pool.query(
      'SELECT id FROM shifts WHERE user_id = $1 AND ended_at IS NULL',
      [req.user!.id]
    );
    // ended_at IS NULL means not closed yet.
    //
    // $1 is a placeholder - the value goes separately, so nobody can type SQL
    // into a form field and have it run. I never glue values into the string.
    //
    // req.user was set by requireAuth. The ! tells TypeScript I know it's there,
    // because requireAuth would have rejected the request otherwise.

    const shift = shiftResult.rows[0];
    // rows is a list. First one, or undefined if there were none.

    if (!shift) {
      return res.status(409).json({ error: 'Start a shift before reporting an incident' });
    }
    // 409 means "this doesn't make sense right now". The request was fine, but
    // an incident has to belong to a shift and there isn't one.

    const result = await pool.query(
      `INSERT INTO incidents
         (shift_id, title, description, location, people_involved, severity, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        shift.id,
        title && String(title).trim() !== '' ? title : 'Incident',
        // Use the title if one came through, otherwise fall back.
        description,
        location ?? null,
        peopleInvolved ?? null,
        // ?? null turns a missing field into a real database NULL instead of
        // the word "undefined".
        level,
        req.user!.id,
      ]
    );
    // RETURNING * hands back the row I just wrote, including the id and
    // created_at the database filled in. Saves me a second query.

    res.status(201).json(result.rows[0]);
    // 201 means created. Send the new row back so the app can show it.
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    // Anything I didn't expect - database down, bad SQL - lands here. 500 means
    // "we broke, not you".
  }
});


// Managers and administrators can list incidents, newest first
router.get('/', requireRole('manager', 'administrator'), async (_req, res) => {
  // _req with an underscore because I don't use it. Keeps the linter quiet.
  try {
    const result = await pool.query(
      `SELECT i.id, i.title, i.description, i.location, i.people_involved,
              i.severity, i.created_at, u.name AS reported_by
       FROM incidents i
       JOIN users u ON u.id = i.created_by
       ORDER BY i.created_at DESC`
    );
    // i and u are short names for the two tables. The JOIN pulls the reporter's
    // name out of users, so the app gets "Braden" instead of a UUID it would
    // have to look up itself. DESC is newest first.

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
// index.ts imports this and mounts it at /incidents.
