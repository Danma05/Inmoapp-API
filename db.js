import pg from 'pg';
const { Pool } = pg;

// Conexión directa a Render (externa = SSL obligatorio)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verificación rápida de conexión (opcional)
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Conectado correctamente a Render (PostgreSQL externo)'))
  .catch(err => console.error('❌ Error de conexión a la base de datos:', err.message));

export default pool;
