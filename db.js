import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.internal')
    ? false
    : { rejectUnauthorized: false }
});

export default pool;
