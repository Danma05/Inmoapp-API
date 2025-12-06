// public/js/mensajes-owner.js

let currentChat = null; // Guardará { otroUsuarioId, propiedadId, nombreUsuario, tituloPropiedad }
let usuarioLogueadoId = null;

export async function initMensajesOwner(usuarioId) {
    usuarioLogueadoId = usuarioId;
    await cargarConversaciones();
}

async function cargarConversaciones() {
    const listaContainer = document.getElementById('chat-list-container');
    if (!listaContainer) return;

    listaContainer.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i></div>';

    try {
        const res = await fetch(`/mensajes/conversaciones?usuarioId=${usuarioLogueadoId}`);
        const conversaciones = await res.json();

        if (conversaciones.length === 0) {
            listaContainer.innerHTML = '<p style="text-align:center; color:#666; padding:20px;">No hay conversaciones activas.</p>';
            return;
        }

        listaContainer.innerHTML = conversaciones.map(c => {
            const fecha = new Date(c.fecha_ultimo).toLocaleDateString();
            const activeClass = (currentChat && currentChat.otroUsuarioId === c.otro_usuario_id && currentChat.propiedadId === c.propiedad_id) ? 'active' : '';
            
            return `
            <div class="msg-item ${activeClass} ${c.no_leidos > 0 ? 'unread' : ''}" 
                 onclick="window.abrirChat(${c.otro_usuario_id}, ${c.propiedad_id}, '${c.otro_usuario_nombre}', '${c.propiedad_titulo}')">
                <div class="msg-avatar">${c.otro_usuario_nombre.charAt(0)}</div>
                <div class="msg-info">
                    <div class="msg-header">
                        <span class="msg-name">${c.otro_usuario_nombre}</span>
                        <span class="msg-time">${fecha}</span>
                    </div>
                    <div class="msg-property"><i class="fa-solid fa-house-chimney"></i> ${c.propiedad_titulo || 'Consulta General'}</div>
                    <div class="msg-preview">${c.ultimo_mensaje}</div>
                </div>
                ${c.no_leidos > 0 ? `<div style="min-width:10px; height:10px; background:red; border-radius:50%;"></div>` : ''}
            </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        listaContainer.innerHTML = '<p style="color:red; text-align:center;">Error de conexión</p>';
    }
}

// Función global para abrir chat al hacer click
window.abrirChat = async (otroId, propId, nombre, tituloProp) => {
    currentChat = { otroUsuarioId: otroId, propiedadId: propId, nombreUsuario: nombre, tituloPropiedad: tituloProp };
    
    // UI Updates
    document.getElementById('empty-state-chat').classList.add('hidden');
    document.getElementById('active-chat-interface').classList.remove('hidden');
    
    document.getElementById('chat-header-name').textContent = nombre;
    document.getElementById('chat-header-prop').textContent = tituloProp || 'Consulta General';
    document.getElementById('chat-header-avatar').textContent = nombre.charAt(0);

    // Recargar lista para actualizar estado "activo"
    cargarConversaciones(); 
    
    // Cargar Mensajes
    const chatBody = document.getElementById('chat-body-scroll');
    chatBody.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        const url = `/mensajes?usuarioId=${usuarioLogueadoId}&otroUsuarioId=${otroId}` + (propId ? `&propiedadId=${propId}` : '');
        const res = await fetch(url);
        const mensajes = await res.json();

        chatBody.innerHTML = mensajes.map(m => {
            const hora = new Date(m.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="message-bubble ${m.tipo}">
                    ${m.mensaje}
                    <span class="msg-time-stamp">${hora}</span>
                </div>
            `;
        }).join('');

        // Scroll al final
        chatBody.scrollTop = chatBody.scrollHeight;

    } catch (e) {
        console.error(e);
        chatBody.innerHTML = '<p style="color:red; text-align:center;">Error cargando mensajes.</p>';
    }
};

// Enviar Mensaje
window.enviarMensajeChat = async () => {
    const input = document.getElementById('message-input-owner');
    const texto = input.value.trim();
    if (!texto || !currentChat) return;

    // UI Optimista (Mostrar mensaje inmediatamente)
    const chatBody = document.getElementById('chat-body-scroll');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    chatBody.insertAdjacentHTML('beforeend', `
        <div class="message-bubble sent" style="opacity:0.7">
            ${texto}
            <span class="msg-time-stamp">${now} (Enviando...)</span>
        </div>
    `);
    chatBody.scrollTop = chatBody.scrollHeight;
    input.value = '';

    try {
        const res = await fetch('/mensajes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                remitenteId: usuarioLogueadoId,
                destinatarioId: currentChat.otroUsuarioId,
                propiedadId: currentChat.propiedadId,
                mensaje: texto
            })
        });

        if (res.ok) {
            // Recargar chat real para confirmar
            window.abrirChat(currentChat.otroUsuarioId, currentChat.propiedadId, currentChat.nombreUsuario, currentChat.tituloPropiedad);
        }
    } catch (e) {
        alert("Error al enviar mensaje");
    }
};

// Enter para enviar
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('message-input-owner');
    if(input) {
        input.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') window.enviarMensajeChat();
        });
    }
});