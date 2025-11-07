// db.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_MS || 30000),
  connectionTimeoutMillis: Number(process.env.PG_CONN_MS || 10000)
});

pool.on('error', (err) => {
  console.error('🛑 pool error (idle client):', err.message);
});

async function warmupWithRetry({ attempts = 5, baseDelayMs = 500 } = {}) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ DB pool listo');
      return;
    } catch (e) {
      const delay = baseDelayMs * 2 ** (i - 1);
      console.warn(`⚠️ Intento ${i}/${attempts} falló: ${e.message}. Reintento en ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error('❌ No fue posible conectar a la base tras varios reintentos');
}
await warmupWithRetry();

export default pool;
