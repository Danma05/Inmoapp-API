// dbQuery.js
import pool from './db.js';

export async function dbQuery(sql, params = [], { retries = 2 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      await pool.query('SET statement_timeout TO 8000'); // evita bloqueos largos
      return await pool.query(sql, params);
    } catch (e) {
      lastErr = e;
      const isTransient =
        ['ECONNRESET', 'ETIMEDOUT'].includes(e.code) ||
        /terminating connection|timeout|could not connect|SSL SYSCALL error/i.test(e.message);

      if (!isTransient || i === retries) break;

      const delay = 300 * (i + 1);
      console.warn(`↻ Reintentando query (${i + 1}/${retries}) en ${delay}ms: ${e.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
