// public/js/admin-auditoria.js
const statusEl = document.getElementById('status');
const tbody = document.querySelector('#auditTable tbody');
const loadBtn = document.getElementById('loadBtn');
const csvBtn = document.getElementById('csvBtn');

function getToken() { try { return localStorage.getItem('inmoapp_token'); } catch (e) { return null; } }

async function load() {
  const limit = Number(document.getElementById('limit').value || 100);
  const offset = Number(document.getElementById('offset').value || 0);
  statusEl.textContent = 'Cargando...';
  tbody.innerHTML = '';
  try {
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/admin/auditoria?limit=${limit}&offset=${offset}`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(()=>({ error: res.statusText }));
      statusEl.textContent = `Error: ${err.error || res.statusText}`;
      return;
    }
    const data = await res.json();
    const rows = data.rows || [];
    if (rows.length === 0) statusEl.textContent = 'No hay registros'; else statusEl.textContent = `Mostrando ${rows.length} registros`;

    for (const r of rows) {
      const tr = document.createElement('tr');
      const ids = r.propiedad_ids || '';
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.admin_nombre || ''}</td>
        <td>${r.admin_id}</td>
        <td style="max-width:400px;overflow:auto">${ids}</td>
        <td>${r.cantidad}</td>
        <td>${new Date(r.creado_en).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    }
  } catch (e) {
    statusEl.textContent = 'Error cargando auditoría';
    console.error(e);
  }
}

function toCSV(rows) {
  const headers = ['id','admin_nombre','admin_id','propiedad_ids','cantidad','creado_en'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = headers.map(h => {
      let v = r[h] === null || typeof r[h] === 'undefined' ? '' : String(r[h]);
      // escape quotes
      v = '"' + v.replace(/"/g, '""') + '"';
      return v;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

csvBtn.addEventListener('click', async () => {
  const limit = Number(document.getElementById('limit').value || 100);
  const offset = Number(document.getElementById('offset').value || 0);
  statusEl.textContent = 'Generando CSV...';
  try {
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/admin/auditoria?limit=${limit}&offset=${offset}`, { headers });
    if (!res.ok) { statusEl.textContent = 'Error al obtener datos'; return; }
    const data = await res.json();
    const csv = toCSV(data.rows || []);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_auditoria_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    statusEl.textContent = 'CSV descargado';
  } catch (e) {
    statusEl.textContent = 'Error generando CSV';
    console.error(e);
  }
});

loadBtn.addEventListener('click', load);
// Auto-load on page open
load();
