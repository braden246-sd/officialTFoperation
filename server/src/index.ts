import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db'; // import the database connection pool
import authRouter from './routes/login'; // import the authentication routes
import shiftsRouter from './routes/shifts'; // import the shift management routes

const app = express();         // create the server
app.use(cors());               // allow other apps to call it
app.use(express.json());       // understand JSON sent by the app
app.use('/auth', authRouter);  // use the authentication routes
app.use('/shifts', shiftsRouter); // use the shift management routes

//asks postgres to return the current time, if it does, then the database is up and running
app.get('/health/db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT now()');
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
//port 4000 is the default port for the server
const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));