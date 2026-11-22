import { pool } from '../db';
import { BUSINESS_DATE_SQL } from '../lib/business-date';
import { sendSummaryEmail } from './mailer';

// Builds the summary of one trading night and emails it. The route just calls
// compileAndSend, so all the actual work is here where I can read and change it
// without going through Express.

export type NightSummary = {
  businessDate: string;
  foodSales: string;
  drinkSales: string;
  totalSales: string;
  // Money comes back from Postgres as a STRING, not a number. That's on
  // purpose, not a bug - NUMERIC holds more precision than a JavaScript number,
  // so the driver hands it over as text rather than quietly rounding it. I pass
  // it straight through. Never do arithmetic on these without converting first.
  incidentCount: number;
  openIssueCount: number;
};


// Add up one night. Takes "YYYY-MM-DD", saves nothing, so I can also use this
// to preview a night.
export async function compileNight(businessDate: string): Promise<NightSummary> {
  // --- Sales ---
  const salesResult = await pool.query(
    `SELECT COALESCE(SUM(food_sales), 0)  AS food,
            COALESCE(SUM(drink_sales), 0) AS drink,
            COALESCE(SUM(total_sales), 0) AS total
     FROM sales_reports
     WHERE report_date = $1`,
    [businessDate]
  );
  // SUM over no rows gives NULL, not 0. COALESCE swaps it for a 0, so a night
  // with no report sent in gives three zeros instead of three blanks that would
  // break the email.

  const sales = salesResult.rows[0];

  // --- Incidents that night ---
  const incidentResult = await pool.query(
    `SELECT COUNT(*) AS count
     FROM incidents
     JOIN shifts ON shifts.id = incidents.shift_id
     WHERE ${BUSINESS_DATE_SQL} = $1`,
    [businessDate]
  );
  // incidents has no date column of its own - it records which shift it
  // happened on, and the shift knows when it started. So I join shifts and
  // apply the business-date rule to its start time.
  //
  // BUSINESS_DATE_SQL is pasted in as text, which is fine because it's my own
  // constant. The date itself goes through $1, where user input belongs.

  // --- Appliance faults still open ---
  const issueResult = await pool.query(
    `SELECT COUNT(*) AS count FROM appliance_issues WHERE status = 'open'`
  );
  // Deliberately not filtered by date. Management wants to know what's broken
  // right now, so a fryer that broke three nights ago and is still waiting
  // should be in today's count.

  return {
    businessDate,
    foodSales: sales.food,
    drinkSales: sales.drink,
    totalSales: sales.total,
    incidentCount: Number(incidentResult.rows[0].count),
    openIssueCount: Number(issueResult.rows[0].count),
    // COUNT also arrives as a string, same reason as the money. These are small
    // enough to convert safely, and the app expects numbers.
  };
}


// Save the night, or update it if I've compiled it before.
export async function saveSummary(summary: NightSummary) {
  const result = await pool.query(
    `INSERT INTO nightly_summaries
       (business_date, food_sales, drink_sales, total_sales, incident_count, open_issue_count)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (business_date) DO UPDATE
       SET food_sales       = EXCLUDED.food_sales,
           drink_sales      = EXCLUDED.drink_sales,
           total_sales      = EXCLUDED.total_sales,
           incident_count   = EXCLUDED.incident_count,
           open_issue_count = EXCLUDED.open_issue_count,
           compiled_at      = now()
     RETURNING *`,
    [
      summary.businessDate,
      summary.foodSales,
      summary.drinkSales,
      summary.totalSales,
      summary.incidentCount,
      summary.openIssueCount,
    ]
  );
  // ON CONFLICT is the piece that makes SC5 true. business_date is the primary
  // key, so a second row for the same night is impossible - without this the
  // insert would just fail the second time. With it, the night gets rebuilt in
  // place, so the job can run twice or be re-run by hand after a fix and the
  // table stays correct.
  //
  // EXCLUDED means "the values I just tried to insert".

  return result.rows[0];
}


// Turn the numbers into the email. Separate from sending so I can change or
// check the wording without touching any mail code.
export function renderSummary(summary: NightSummary): { subject: string; body: string } {
  const subject = `Tommyfield nightly summary - ${summary.businessDate}`;

  const body =
    `Night of ${summary.businessDate}\n\n` +
    `Food sales:  $${summary.foodSales}\n` +
    `Drink sales: $${summary.drinkSales}\n` +
    `Total sales: $${summary.totalSales}\n\n` +
    `Incidents: ${summary.incidentCount}\n` +
    `Appliance issues still open: ${summary.openIssueCount}\n`;
  // Plain text, no HTML. \n is a line break. Plain text always arrives
  // readable, which matters more than looks for a nightly figures email.

  return { subject, body };
}


// The whole job: add the night up, save it, try to email it, record what
// happened.
export async function compileAndSend(businessDate: string) {
  const summary = await compileNight(businessDate);

  const saved = await saveSummary(summary);
  // Saved BEFORE I try the email. The order matters - the figures are the thing
  // that has to survive, and the email is a convenience on top. If the mail
  // server is down I still want the row.

  const { subject, body } = renderSummary(summary);

  const mail = await sendSummaryEmail(subject, body);
  // Comes back as { sent: true } or { sent: false, note }. It never throws, so a
  // mail problem can't undo the save above.

  if (mail.sent) {
    await pool.query(
      `UPDATE nightly_summaries
         SET emailed_at = now(), mail_note = NULL
       WHERE business_date = $1`,
      [businessDate]
    );
    // Stamp the time and clear any old note from a previous failed attempt.
  } else {
    await pool.query(
      `UPDATE nightly_summaries
         SET mail_note = $2
       WHERE business_date = $1`,
      [businessDate, mail.note]
    );
    // Write down why it didn't go, usually "No mail provider configured".
    //
    // This is the half of SC5 people skip. Failing quietly would leave nobody
    // able to tell whether the email was sent, and throwing would lose the
    // figures. Writing the reason down does neither.
  }

  return { summary: saved, email: mail };
}
