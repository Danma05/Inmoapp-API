// scripts/smoke-tests.js
// Small non-destructive smoke tests against the deployed API.
// Usage: node scripts/smoke-tests.js
import axios from 'axios';

const BASE = process.env.TEST_BASE_URL || process.env.RENDER_EXTERNAL_URL || 'https://inmoapp-api.onrender.com';

async function run() {
  console.log('Running smoke tests against', BASE);
  const failures = [];

  // 1) Health
  try {
    const h = await axios.get(`${BASE}/health`, { timeout: 5000 });
    if (h.status !== 200 || !h.data || !h.data.ok) {
      failures.push('Health check failed');
      console.error('Health:', h.status, h.data);
    } else {
      console.log('✔ /health ok');
    }
  } catch (e) {
    failures.push('Health request error: ' + (e.message || e));
    console.error('✖ /health error', e.message || e);
  }

  // 2) Check protected endpoint /admin/auditoria without token -> expect 401 or 401-like
  try {
    const r = await axios.get(`${BASE}/admin/auditoria`, { timeout: 5000, validateStatus: () => true });
    if (r.status === 401 || r.status === 403) {
      console.log(`✔ /admin/auditoria returned ${r.status} as expected when unauthenticated`);
    } else {
      failures.push(`/admin/auditoria expected 401/403 but got ${r.status}`);
      console.error('/admin/auditoria response:', r.status, r.data);
    }
  } catch (e) {
    failures.push('Admin auditoria request error: ' + (e.message || e));
    console.error('✖ /admin/auditoria error', e.message || e);
  }

  // 3) Check propiedades listing (read-only)
  try {
    const p = await axios.get(`${BASE}/propiedades?limit=1`, { timeout: 5000 });
    if (p.status === 200 && p.data && p.data.propiedades) {
      console.log('✔ /propiedades listing ok');
    } else {
      failures.push('/propiedades listing unexpected response');
      console.error('/propiedades:', p.status, p.data);
    }
  } catch (e) {
    failures.push('Propiedades request error: ' + (e.message || e));
    console.error('✖ /propiedades error', e.message || e);
  }

  if (failures.length > 0) {
    console.error('\nSmoke tests finished with failures:');
    failures.forEach(f => console.error('- ' + f));
    process.exit(1);
  }

  console.log('\nAll smoke tests passed.');
  process.exit(0);
}

run();
