import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { compileAndSend } from '../services/summary';
import { businessDateNow } from '../lib/business-date';

// The nightly summary endpoints. There's deliberately almost nothing here - I
// read the request, hand the work to services/summary.ts, and send back what
// comes out.

const router = Router();
router.use(requireAuth);


// POST /summaries/compile
// Body: { "date": "2026-11-22" } - leave it out for the night that just ended.
//
// For the prototype I trigger this by hand so it can be shown in a demo. Later
// the same function gets called by a scheduled job at 6am.
router.post('/compile', requireRole('manager', 'administrator'), async (req, res) => {
  try {
    const businessDate = req.body?.date ?? businessDateNow();
    // ?. so a request with no body at all doesn't crash. ?? falls back to
    // working out which night just finished.

    const result = await compileAndSend(businessDate);

    res.status(201).json(result);
    // Sends back the saved figures and what happened with the email, so whoever
    // triggered it sees "No mail provider configured" rather than wondering
    // whether an email went out.
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// GET /summaries/:date - one night I've already compiled
router.get('/:date', requireRole('manager', 'administrator'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM nightly_summaries WHERE business_date = $1',
      [req.params.date]
    );
    // The :date in the path becomes req.params.date, so
    // GET /summaries/2026-11-22 looks up that night.

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'That night has not been compiled yet' });
    }
    // Saying so clearly. An empty object would leave the app guessing whether
    // the night was quiet or simply never built.

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
