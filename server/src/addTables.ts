import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './db';

// Creates my three extra tables. Run it after db:init, since they point at
// shifts and users:
//
//   npm run db:init   <- users, shifts, sales_reports
//   npm run db:add    <- this
//   npm run db:seed   <- test accounts

async function main() {
  const sql = readFileSync(join(process.cwd(), 'db', 'schema-additions.sql'), 'utf8');
  // process.cwd() is wherever npm ran from, which is the server folder. Reading
  // the file keeps the SQL in one place instead of pasted into a string here.

  await pool.query(sql);
  // The whole file goes over at once. Everything in it uses IF NOT EXISTS, so
  // running this twice does nothing the second time.

  console.log('Extra tables applied. incidents, appliance_issues and nightly_summaries are ready.');

  await pool.end();
  // Close the pool or the script just sits there instead of finishing.
}

main().catch((err) => {
  console.error('Failed to apply the extra tables:', err.message);
  process.exit(1);
  // Exit 1 so a failure doesn't look like it worked.
});
