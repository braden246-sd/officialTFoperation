import 'dotenv/config';
import { hash } from 'bcryptjs';
import { pool } from './db';

const users = [
  { name: 'Admin', email: 'admin@tommyfield.ca', role: 'administrator' },
  { name: 'Manager', email: 'manager@tommyfield.ca', role: 'manager' },
  { name: 'Supervisor', email: 'supervisor@tommyfield.ca', role: 'supervisor' },
];

async function main() {
  const passwordHash = await hash('password123', 10);
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, passwordHash, u.role]
    );
  }
  console.log('Test users ready (password: password123)');
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});