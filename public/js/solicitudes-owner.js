// public/js/solicitudes-owner.js

export async function cargarSolicitudesPropietario(usuarioId) {
    const contenedorVisitas = document.getElementById('lista-visitas-owner');
    const contenedorPostulaciones = document.getElementById('lista-postulaciones-owner');
    
    if(!contenedorVisitas || !contenedorPostulaciones) return;

    // 1. Cargar Visitas
    try {
        const res = await fetch(`/api/visitas?propietarioId=${usuarioId}`);
        const visitas = await res.json();
        
        if(visitas.length === 0) {
            contenedorVisitas.innerHTML = '<p class="text-gray">No hay visitas programadas.</p>';
        } else {
            contenedorVisitas.innerHTML = visitas.map(v => cardVisitaHTML(v)).join('');
        }
    } catch(e) { console.error(e); }

    // 2. Cargar Postulaciones
    try {
        const res = await fetch(`/api/postulaciones?propietarioId=${usuarioId}`);
        const postulaciones = await res.json();

        if(postulaciones.length === 0) {
            contenedorPostulaciones.innerHTML = '<p class="text-gray">No hay postulaciones nuevas.</p>';
        } else {
            contenedorPostulaciones.innerHTML = postulaciones.map(p => cardPostulacionHTML(p)).join('');
        }
    } catch(e) { console.error(e); }
}

// --- HTML DE LAS TARJETAS ---

function cardVisitaHTML(v) {
    const esPendiente = v.estado === 'PENDIENTE';
    const fecha = new Date(v.fecha_visita).toLocaleDateString();
    
    return `
    <div class="request-card" id="visita-${v.visita_id}">
        <div class="req-header">
            <span class="req-type visita"><i class="fa-regular fa-clock"></i> Visita</span>
            <span class="status-badge ${v.estado}">${v.estado}</span>
        </div>
        <div class="req-body">
            <h4>${v.direccion}</h4>
            <p><strong>Interesado:</strong> ${v.usuario_nombre}</p>
            <p><strong>Fecha:</strong> ${fecha} - ${v.hora_visita}</p>
            ${v.notas ? `<p class="req-note">"${v.notas}"</p>` : ''}
        </div>
        ${esPendiente ? `
        <div class="req-actions">
            <button onclick="window.gestionarVisita(${v.visita_id}, 'CONFIRMADA')" class="btn-accept">Confirmar</button>
            <button onclick="window.gestionarVisita(${v.visita_id}, 'CANCELADA')" class="btn-reject">Rechazar</button>
        </div>` : ''}
    </div>`;
}

function cardPostulacionHTML(p) {
    const esPendiente = p.estado === 'PENDIENTE';
    return `
    <div class="request-card" id="postulacion-${p.postulacion_id}">
        <div class="req-header">
            <span class="req-type postulacion"><i class="fa-solid fa-file-contract"></i> Postulación</span>
            <span class="status-badge ${p.estado}">${p.estado}</span>
        </div>
        <div class="req-body">
            <h4>${p.direccion}</h4>
            <p class="req-price">${p.precio_canon}</p>
            <p><strong>Candidato:</strong> ${p.usuario_nombre}</p>
            <p style="font-size:0.85rem; color:#666;">Tel: ${p.usuario_telefono || 'No disponible'}</p>
            ${p.mensaje ? `<p class="req-msg">"${p.mensaje}"</p>` : ''}
        </div>
        ${esPendiente ? `
        <div class="req-actions">
            <button onclick="window.gestionarPostulacion(${p.postulacion_id}, 'APROBADA')" class="btn-accept">Aprobar</button>
            <button onclick="window.gestionarPostulacion(${p.postulacion_id}, 'RECHAZADA')" class="btn-reject">Rechazar</button>
        </div>` : ''}
    </div>`;
}

// --- FUNCIONES GLOBALES PARA LOS BOTONES ---

window.gestionarVisita = async (id, nuevoEstado) => {
    if(!confirm(`¿Deseas marcar esta visita como ${nuevoEstado}?`)) return;
    try {
        const res = await fetch(`/api/visitas/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if(res.ok) {
            alert("Estado actualizado");
            // Recargar la lista (puedes optimizar para no recargar todo)
            const user = JSON.parse(localStorage.getItem('inmoapp_user'));
            cargarSolicitudesPropietario(user.id);
        }
    } catch(e) { alert("Error al actualizar"); }
};

window.gestionarPostulacion = async (id, nuevoEstado) => {
    if(!confirm(`¿${nuevoEstado} esta postulación?`)) return;
    try {
        const res = await fetch(`/api/postulaciones/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if(res.ok) {
            alert("Estado actualizado");
            const user = JSON.parse(localStorage.getItem('inmoapp_user'));
            cargarSolicitudesPropietario(user.id);
        }
    } catch(e) { alert("Error al actualizar"); }
};