import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './db';

// This script initializes the database by applying the schema defined in schema.sql. It reads the SQL file and executes it against the PostgreSQL database using the connection pool. If successful, it logs a confirmation message; if an error occurs, it logs the error and exits the process with a failure code.

async function main() {
  const sql = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Schema applied. Tables are ready.');
  await pool.end();
}

main().catch((err) => {
  console.error('Failed to apply schema:', err.message);
  process.exit(1);
});