import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
 // This route handles shift management. It allows logged-in users with the 'supervisor' role to start and end shifts, as well as retrieve information about their current and latest shifts.

const router = Router();

// Every route in this file: logged in AND supervisor
router.use(requireAuth, requireRole('supervisor'));

// Start a shift
router.post('/start', async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO shifts (user_id) VALUES ($1) RETURNING *',
      [req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already have a shift running' });
    }
    res.status(500).json({ error: err.message });
  }
});

// End the running shift
router.post('/end', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE shifts SET ended_at = now()
       WHERE user_id = $1 AND ended_at IS NULL
       RETURNING *`,
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No running shift to end' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// The running shift, or null if there is none
router.get('/current', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shifts WHERE user_id = $1 AND ended_at IS NULL',
      [req.user!.id]
    );
    res.json({ shift: result.rows[0] ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// The most recent shift, running or finished
router.get('/latest', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shifts WHERE user_id = $1 ORDER BY started_at DESC LIMIT 1',
      [req.user!.id]
    );
    res.json({ shift: result.rows[0] ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;