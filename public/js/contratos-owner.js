// public/js/contratos-owner.js

export async function cargarContratosOwner(usuarioId) {
    const contenedor = document.getElementById('lista-contratos-owner');
    if (!contenedor) return;

    contenedor.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        const res = await fetch(`/api/contratos?propietarioId=${usuarioId}`);
        const contratos = await res.json();

        if (contratos.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state-panel">
                    <i class="fa-solid fa-file-signature"></i>
                    <h3>No tienes contratos activos</h3>
                    <p>Crea un contrato desde una postulación aprobada o manualmente.</p>
                    <button class="btn-primary-red" onclick="alert('Función de crear manual pendiente')">Crear Nuevo</button>
                </div>`;
            return;
        }

        contenedor.innerHTML = `<div class="contracts-grid">` + contratos.map(c => `
            <div class="contract-card-detailed ${c.estado === 'FINALIZADO' ? 'finished' : ''}">
                <div class="contract-header-card">
                    <div class="contract-icon-box ${c.estado === 'VIGENTE' ? 'active' : ''}">
                        <i class="fa-solid fa-file-contract"></i>
                    </div>
                    <div class="contract-id-info">
                        <h3>Contrato #${c.id}</h3>
                        <span class="contract-prop-name">${c.direccion}</span>
                    </div>
                    <span class="status-badge ${c.estado === 'VIGENTE' ? 'published' : 'review'}">${c.estado}</span>
                </div>
                <div class="contract-body-card">
                    <div class="c-row"><span class="c-label">Inquilino:</span> <span class="c-val text-dark">${c.inquilino_nombre}</span></div>
                    <div class="c-row"><span class="c-label">Inicio:</span> <span class="c-val">${new Date(c.fecha_inicio).toLocaleDateString()}</span></div>
                    <div class="c-row"><span class="c-label">Fin:</span> <span class="c-val">${new Date(c.fecha_fin).toLocaleDateString()}</span></div>
                    <div class="c-row"><span class="c-label">Monto:</span> <span class="c-val text-dark" style="color:var(--brand-red)">${c.monto_mensual}</span></div>
                </div>
                <div class="contract-footer-card">
                    <button class="btn-view-contract" style="width:100%; padding:8px; border:1px solid #ddd; background:white; border-radius:6px; cursor:pointer;">Ver Detalles</button>
                </div>
            </div>
        `).join('') + `</div>`;

    } catch (e) {
        console.error(e);
        contenedor.innerHTML = '<p style="color:red; text-align:center;">Error al cargar contratos.</p>';
    }
}