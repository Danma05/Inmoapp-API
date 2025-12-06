// public/js/contratos-tenant.js

export async function cargarContratosInquilino(usuarioId) {
    const contenedor = document.getElementById('lista-contratos-inquilino');
    if (!contenedor) return;

    contenedor.innerHTML = '<div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando tus contratos...</div>';

    try {
        // Consultamos la API filtrando por usuarioId (el backend buscará en arrendatario_id)
        const res = await fetch(`/api/contratos?usuarioId=${usuarioId}`);
        const contratos = await res.json();

        if (contratos.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state-panel" style="text-align:center; padding:40px; color:#6B7280; background:#F9FAFB; border-radius:12px; border:1px dashed #D1D5DB;">
                    <i class="fa-solid fa-file-contract" style="font-size:3rem; margin-bottom:15px; color:#D1D5DB;"></i>
                    <h3 style="color:#374151; font-size:1.1rem; margin-bottom:5px;">No tienes contratos activos</h3>
                    <p style="font-size:0.9rem;">Los contratos generados por los propietarios aparecerán aquí.</p>
                </div>`;
            return;
        }

        contenedor.innerHTML = `<div class="contracts-grid" style="display:grid; gap:20px;">` + 
        contratos.map(c => `
            <div class="contract-card-detailed" style="background:white; border:1px solid #E5E7EB; border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:15px; box-shadow:0 2px 5px rgba(0,0,0,0.02);">
                
                <div class="contract-header-card" style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #F3F4F6; padding-bottom:15px;">
                    <div style="display:flex; gap:15px; align-items:center;">
                        <div style="width:45px; height:45px; background:#EFF6FF; color:#2563EB; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                            <i class="fa-solid fa-file-signature"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size:1rem; color:#111827;">Contrato #${c.id}</h3>
                            <span style="font-size:0.85rem; color:#6B7280;">${c.direccion}</span>
                        </div>
                    </div>
                    <span class="status-badge" style="background:${c.estado === 'VIGENTE' ? '#DCFCE7' : '#F3F4F6'}; color:${c.estado === 'VIGENTE' ? '#16A34A' : '#6B7280'}; padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:700;">
                        ${c.estado}
                    </span>
                </div>

                <div class="contract-body-card" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.9rem; color:#4B5563;">
                    <div><span style="color:#9CA3AF; font-size:0.8rem;">Propietario</span><br><strong>${c.propietario_nombre}</strong></div>
                    <div style="text-align:right;"><span style="color:#9CA3AF; font-size:0.8rem;">Monto</span><br><strong style="color:var(--brand-red);">${c.monto_mensual}</strong></div>
                    
                    <div><span style="color:#9CA3AF; font-size:0.8rem;">Inicio</span><br>${new Date(c.fecha_inicio).toLocaleDateString()}</div>
                    <div style="text-align:right;"><span style="color:#9CA3AF; font-size:0.8rem;">Fin</span><br>${new Date(c.fecha_fin).toLocaleDateString()}</div>
                </div>

                <div class="contract-footer-card" style="border-top:1px dashed #E5E7EB; padding-top:15px;">
                    <button onclick="window.open('/api/contratos/${c.id}/pdf', '_blank')" 
                        class="btn-download" 
                        style="width:100%; padding:10px; background:#1F2937; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:500; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <i class="fa-solid fa-download"></i> Descargar PDF
                    </button>
                </div>
            </div>
        `).join('') + `</div>`;

    } catch (e) {
        console.error(e);
        contenedor.innerHTML = '<p style="color:red; text-align:center;">Error al cargar tus contratos.</p>';
    }
}