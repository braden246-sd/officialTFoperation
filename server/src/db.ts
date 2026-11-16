import 'dotenv/config';
import { Pool } from 'pg';

// create a connection pool to the database, using the connection string from the .env file
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });