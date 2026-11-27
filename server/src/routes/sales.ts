import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Supervisor submits the report for their latest (finished) shift
router.post('/', requireRole('supervisor'), async (req, res) => {
  try {
    const { foodSales, drinkSales, totalSales, source } = req.body;
    const food = Number(foodSales);
    const drink = Number(drinkSales);
    const total = Number(totalSales);

    if (![food, drink, total].every((n) => Number.isFinite(n) && n >= 0)) {
      return res.status(400).json({ error: 'Sales amounts must be numbers of 0 or more' });
    }
    if (Math.abs(food + drink - total) > 0.01) {
      return res.status(400).json({ error: 'Food + drink must equal the total' });
    }

    // The supervisor's most recent shift. The date is the day the shift STARTED in Calgary time,
    // so a shift that runs past midnight still counts for the day it began.
    const shiftResult = await pool.query(
      `SELECT id, ended_at,
              to_char(started_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD') AS business_date
       FROM shifts WHERE user_id = $1 ORDER BY started_at DESC LIMIT 1`,
      [req.user!.id]
    );
    const shift = shiftResult.rows[0];

    if (!shift) {
      return res.status(400).json({ error: 'You have no shift to report on' });
    }
    if (!shift.ended_at) {
      return res.status(409).json({ error: 'End your shift before submitting the sales report' });
    }

    const result = await pool.query(
      `INSERT INTO sales_reports
         (shift_id, report_date, food_sales, drink_sales, total_sales, source, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [shift.id, shift.business_date, food, drink, total,
       source === 'ocr' ? 'ocr' : 'manual', req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A sales report was already submitted for this shift' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Managers and administrators can list reports
router.get('/', requireRole('manager', 'administrator'), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.report_date, s.food_sales, s.drink_sales, s.total_sales, s.source,
              s.created_at, u.name AS submitted_by
       FROM sales_reports s
       JOIN users u ON u.id = s.created_by
       ORDER BY s.report_date DESC, s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;