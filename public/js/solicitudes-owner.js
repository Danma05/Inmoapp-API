// public/js/solicitudes-owner.js

export async function cargarSolicitudesPropietario(usuarioId) {
    const contenedorVisitas = document.getElementById('lista-visitas-owner');
    const contenedorPostulaciones = document.getElementById('lista-postulaciones-owner');
    
    // 1. Cargar Visitas
    if(contenedorVisitas) {
        try {
            const res = await fetch(`/api/visitas?propietarioId=${usuarioId}`);
            const visitas = await res.json();
            
            if(visitas.length === 0) {
                contenedorVisitas.innerHTML = '<p style="color:#666; padding:10px;">No tienes visitas programadas.</p>';
            } else {
                contenedorVisitas.innerHTML = visitas.map(v => cardVisitaHTML(v)).join('');
            }
        } catch(e) { console.error(e); }
    }

    // 2. Cargar Postulaciones
    if(contenedorPostulaciones) {
        try {
            const res = await fetch(`/api/postulaciones?propietarioId=${usuarioId}`);
            const postulaciones = await res.json();

            if(postulaciones.length === 0) {
                contenedorPostulaciones.innerHTML = '<p style="color:#666; padding:10px;">No hay postulaciones nuevas.</p>';
            } else {
                contenedorPostulaciones.innerHTML = postulaciones.map(p => cardPostulacionHTML(p)).join('');
            }
        } catch(e) { console.error(e); }
    }
}

// --- HTML DE LAS TARJETAS ---

function cardVisitaHTML(v) {
    const esPendiente = v.estado === 'PENDIENTE';
    const fecha = new Date(v.fecha_visita).toLocaleDateString();
    
    return `
    <div class="request-card">
        <div class="req-header">
            <span class="req-type visita"><i class="fa-regular fa-clock"></i> VISITA</span>
            <span class="status-badge ${v.estado === 'PENDIENTE' ? 'review' : 'published'}">${v.estado}</span>
        </div>
        <h4>${v.direccion}</h4>
        <p class="text-gray"><strong>Solicitante:</strong> ${v.inquilino_nombre}</p>
        <p class="text-gray"><strong>Fecha:</strong> ${fecha} - ${v.hora_visita}</p>
        ${esPendiente ? `
        <div class="req-actions">
            <button onclick="window.gestionarVisita(${v.visita_id}, 'CONFIRMADA')" class="btn-accept">Confirmar</button>
            <button onclick="window.gestionarVisita(${v.visita_id}, 'CANCELADA')" class="btn-reject">Rechazar</button>
        </div>` : ''}
    </div>`;
}

function cardPostulacionHTML(p) {
    const esPendiente = p.estado === 'PENDIENTE';
    const esAprobada = p.estado === 'APROBADA'; // <--- Detectar si está aprobada

    // Preparamos datos para el botón (como string JSON seguro)
    const datosContrato = esAprobada ? JSON.stringify({
        propiedadId: p.propiedad_id,
        arrendatarioId: p.usuario_id,
        propietarioId: p.propietario_id,
        monto: p.precio_canon
    }).replace(/"/g, '&quot;') : null;

    return `
    <div class="request-card">
        <div class="req-header">
            <span class="req-type postulacion"><i class="fa-solid fa-file-contract"></i> POSTULACIÓN</span>
            <span class="status-badge ${p.estado === 'PENDIENTE' ? 'review' : (esAprobada ? 'approved' : 'rejected')}">${p.estado}</span>
        </div>
        <h4>${p.direccion}</h4>
        <p class="req-price">${p.precio_canon}</p>
        <p class="text-gray"><strong>Candidato:</strong> ${p.inquilino_nombre}</p>
        
        ${p.mensaje ? `<p class="req-msg">"${p.mensaje}"</p>` : ''}
        
        ${esPendiente ? `
        <div class="req-actions">
            <button onclick="window.gestionarPostulacion(${p.postulacion_id}, 'APROBADA')" class="btn-accept">Aprobar</button>
            <button onclick="window.gestionarPostulacion(${p.postulacion_id}, 'RECHAZADA')" class="btn-reject">Rechazar</button>
        </div>` : ''}

        ${esAprobada ? `
        <div class="req-actions">
            <button onclick="window.crearContratoDesdePostulacion(${datosContrato})" 
                style="width:100%; background:#2563EB; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:600;">
                <i class="fa-solid fa-file-signature"></i> Generar Contrato
            </button>
        </div>` : ''}
    </div>`;
}

// --- FUNCIONES GLOBALES ---

window.gestionarVisita = async (id, nuevoEstado) => {
    if(!confirm(`¿Confirmas ${nuevoEstado} esta visita?`)) return;
    try {
        await fetch(`/api/visitas/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ estado: nuevoEstado })
        });
        recargarLista();
    } catch(e) { alert("Error al actualizar"); }
};

window.gestionarPostulacion = async (id, nuevoEstado) => {
    if(!confirm(`¿${nuevoEstado} esta postulación?`)) return;
    try {
        await fetch(`/api/postulaciones/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ estado: nuevoEstado })
        });
        recargarLista();
    } catch(e) { alert("Error al actualizar"); }
};

// 🔥 FUNCIÓN NUEVA: Crear Contrato
window.crearContratoDesdePostulacion = async (data) => {
    if(!confirm("¿Generar contrato oficial para este inquilino?")) return;

    // Calcular fechas automáticas (Inicio: Hoy, Fin: 1 año)
    const hoy = new Date();
    const unAno = new Date();
    unAno.setFullYear(hoy.getFullYear() + 1);

    const payload = {
        propiedadId: data.propiedadId,
        arrendatarioId: data.arrendatarioId,
        propietarioId: data.propietarioId,
        monto: data.monto,
        fechaInicio: hoy.toISOString().split('T')[0],
        fechaFin: unAno.toISOString().split('T')[0]
    };

    try {
        const res = await fetch('/api/contratos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("✅ ¡Contrato generado exitosamente!\nVe a la pestaña 'Contratos' para verlo.");
            // Opcional: Redirigir a la pestaña contratos
            document.querySelector('[data-tab="contratos"]').click();
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || "No se pudo crear"));
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión");
    }
};

function recargarLista() {
    const user = JSON.parse(localStorage.getItem('inmoapp_user'));
    if(user) cargarSolicitudesPropietario(user.id);
}