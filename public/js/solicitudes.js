// solicitudes.js

const API_URL = 'https://inmoapp-api.onrender.com'; // Asegúrate que esta URL es correcta

export async function initSolicitudes(usuarioId) {
    console.log("Cargando solicitudes para propietario:", usuarioId);
    await cargarVisitas(usuarioId);
    await cargarPostulaciones(usuarioId);
}

// --- 1. CARGAR VISITAS ---
async function cargarVisitas(usuarioId) {
    const contenedor = document.getElementById('lista-visitas');
    
    try {
        const response = await fetch(`${API_URL}/visitas?propietarioId=${usuarioId}`); // Ajusta endpoint si es necesario
        if (!response.ok) throw new Error('Error API Visitas');
        const visitas = await response.json();
        
        contenedor.innerHTML = ''; 

        // Filtrar solo las pendientes
        const pendientes = visitas.filter(v => v.estado === 'pendiente');

        if (pendientes.length === 0) {
            contenedor.innerHTML = '<div class="empty-state-small">No tienes solicitudes de visita pendientes.</div>';
            return;
        }

        pendientes.forEach(visita => {
            const card = crearCardSolicitud(visita, 'visita');
            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="empty-state-small text-danger">Error al cargar visitas.</div>';
    }
}

// --- 2. CARGAR POSTULACIONES ---
async function cargarPostulaciones(usuarioId) {
    const contenedor = document.getElementById('lista-postulaciones');
    
    try {
        const response = await fetch(`${API_URL}/postulaciones?propietarioId=${usuarioId}`);
        if (!response.ok) throw new Error('Error API Postulaciones');
        const postulaciones = await response.json();
        
        contenedor.innerHTML = ''; 

        const pendientes = postulaciones.filter(p => p.estado === 'pendiente');

        if (pendientes.length === 0) {
            contenedor.innerHTML = '<div class="empty-state-small">No tienes postulaciones pendientes.</div>';
            return;
        }

        pendientes.forEach(postulacion => {
            const card = crearCardSolicitud(postulacion, 'postulacion');
            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="empty-state-small text-danger">Error al cargar postulaciones.</div>';
    }
}

// --- 3. CREAR HTML DE LA CARD ---
function crearCardSolicitud(data, tipo) {
    const div = document.createElement('div');
    div.className = `request-card ${tipo}`; // Agrega clase 'visita' o 'postulacion' para el borde de color

    // Lógica visual según tipo
    const icono = tipo === 'visita' ? '<i class="fa-regular fa-clock"></i>' : '<i class="fa-solid fa-money-bill"></i>';
    
    const detalleHTML = tipo === 'visita' 
        ? `<strong>Fecha:</strong> ${new Date(data.fecha).toLocaleDateString()}<br>
           <strong>Hora:</strong> ${data.hora}`
        : `<strong>Oferta:</strong> $${data.ofertaEconomica}<br>
           <span style="font-style:italic">"${data.mensaje || ''}"</span>`;

    div.innerHTML = `
        <div class="req-header">
            <div class="req-property"><i class="fa-solid fa-house"></i> ${data.propiedadNombre || 'Propiedad #' + data.propiedadId}</div>
        </div>
        <div class="req-user">
            <i class="fa-solid fa-user"></i> ${data.usuarioNombre}
        </div>
        <div class="req-details">
            ${icono} ${detalleHTML}
        </div>
        <div class="req-actions">
            <button class="btn-accept"><i class="fa-solid fa-check"></i> Aceptar</button>
            <button class="btn-reject"><i class="fa-solid fa-xmark"></i> Rechazar</button>
        </div>
    `;

    // Event Listeners
    div.querySelector('.btn-accept').addEventListener('click', () => procesarSolicitud(data.id, tipo, 'aceptada', div));
    div.querySelector('.btn-reject').addEventListener('click', () => procesarSolicitud(data.id, tipo, 'rechazada', div));

    return div;
}

// --- 4. LÓGICA DE ACTUALIZACIÓN ---
async function procesarSolicitud(id, tipo, nuevoEstado, cardElement) {
    if(!confirm(`¿Confirmas que deseas marcar esta solicitud como ${nuevoEstado}?`)) return;

    const endpoint = tipo === 'visita' ? 'visitas' : 'postulaciones';
    
    try {
        const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (response.ok) {
            // Animación de salida simple
            cardElement.style.opacity = '0.5';
            cardElement.innerHTML = `<div style="padding:20px; text-align:center; color:green;"><i class="fa-solid fa-check-circle"></i> ¡Solicitud ${nuevoEstado}!</div>`;
            setTimeout(() => cardElement.remove(), 1500);
        } else {
            alert('Error al actualizar el estado en el servidor.');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión.');
    }
}