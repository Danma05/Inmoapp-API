// public/js/mensajes-tenant.js
import { obtenerUsuario } from './propiedades.js';

let currentChat = null; 
let usuarioLogueadoId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = obtenerUsuario();
    if (!user) {
        window.location.href = '/'; 
        return;
    }
    usuarioLogueadoId = user.id;
    
    await cargarConversaciones();
    
    // Verificar si venimos de "Contactar"
    const params = new URLSearchParams(window.location.search);
    const propId = params.get('propiedadId');
    const ownerId = params.get('propietarioId');
    
    if (propId && ownerId) {
        const ownerName = params.get('nombre') || 'Propietario';
        const propTitle = params.get('titulo') || 'Propiedad';
        
        // Abrir chat y limpiar URL
        seleccionarChat(ownerId, propId, ownerName, propTitle);
        window.history.replaceState({}, document.title, "/mensajes");
    }

    // Listeners
    const input = document.getElementById('message-input');
    if(input) {
        input.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') enviarMensajeTenant();
        });
    }
    const btnSend = document.getElementById('btn-send-message');
    if(btnSend) {
        btnSend.addEventListener('click', enviarMensajeTenant);
    }
});

async function cargarConversaciones() {
    const listaContainer = document.getElementById('chat-list-container');
    if (!listaContainer) return;

    listaContainer.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        // 🔥 CORRECCIÓN AQUÍ: Agregado /api/
        const res = await fetch(`/api/mensajes/conversaciones?usuarioId=${usuarioLogueadoId}`);
        
        if (!res.ok) throw new Error('Error en la petición'); // Verificar error HTTP
        
        const conversaciones = await res.json();

        if (conversaciones.length === 0) {
            listaContainer.innerHTML = `
                <div style="text-align:center; padding:30px; color:#6B7280;">
                    <p>No tienes mensajes.</p>
                </div>`;
            return;
        }

        listaContainer.innerHTML = conversaciones.map(c => {
            const fecha = new Date(c.fecha_ultimo).toLocaleDateString();
            const activeClass = (currentChat && currentChat.otroUsuarioId == c.otro_usuario_id && currentChat.propiedadId == c.propiedad_id) ? 'active' : '';
            const nombreMostrar = c.otro_usuario_nombre || 'Usuario';
            
            return `
            <div class="msg-item ${activeClass} ${c.no_leidos > 0 ? 'unread' : ''}" 
                 onclick="window.seleccionarChat(${c.otro_usuario_id}, ${c.propiedad_id}, '${nombreMostrar}', '${c.propiedad_titulo}')">
                <div class="msg-avatar">${nombreMostrar.charAt(0)}</div>
                <div class="msg-info">
                    <div class="msg-header">
                        <span class="msg-name">${nombreMostrar}</span>
                        <span class="msg-time">${fecha}</span>
                    </div>
                    <div class="msg-property">${c.propiedad_titulo || 'Consulta'}</div>
                    <div class="msg-preview">${c.ultimo_mensaje}</div>
                </div>
            </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        listaContainer.innerHTML = '<p style="color:red; text-align:center;">No se pudieron cargar los chats.</p>';
    }
}

window.seleccionarChat = async (otroId, propId, nombre, tituloProp) => {
    currentChat = { otroUsuarioId: otroId, propiedadId: propId };
    
    document.getElementById('chat-header-name').textContent = nombre;
    document.getElementById('chat-header-prop').textContent = tituloProp || 'Propiedad';
    document.getElementById('chat-header-avatar').textContent = nombre.charAt(0);

    const emptyState = document.getElementById('empty-state');
    const chatInterface = document.getElementById('chat-interface');
    if(emptyState) emptyState.classList.add('hidden');
    if(chatInterface) chatInterface.classList.remove('hidden');

    const chatBody = document.getElementById('chat-body-scroll');
    chatBody.innerHTML = '<div style="text-align:center; padding:20px;">Cargando...</div>';

    try {
        // 🔥 CORRECCIÓN AQUÍ: Agregado /api/
        const url = `/api/mensajes?usuarioId=${usuarioLogueadoId}&otroUsuarioId=${otroId}` + (propId ? `&propiedadId=${propId}` : '');
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al cargar mensajes');
        
        const mensajes = await res.json();

        chatBody.innerHTML = mensajes.map(m => {
            const estilo = m.remitente_id == usuarioLogueadoId ? 'sent' : 'received';
            const hora = new Date(m.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `<div class="message-bubble ${estilo}">${m.mensaje}<span class="msg-time-stamp">${hora}</span></div>`;
        }).join('');

        chatBody.scrollTop = chatBody.scrollHeight;

    } catch (e) {
        console.error(e);
        chatBody.innerHTML = '<p style="color:red; text-align:center;">Error al cargar mensajes.</p>';
    }
};

window.enviarMensajeTenant = async () => {
    const input = document.getElementById('message-input');
    const texto = input.value.trim();
    if (!texto || !currentChat) return;

    // UI Optimista
    const chatBody = document.getElementById('chat-body-scroll');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    chatBody.insertAdjacentHTML('beforeend', `<div class="message-bubble sent" style="opacity:0.7">${texto}<span class="msg-time-stamp">${now}...</span></div>`);
    chatBody.scrollTop = chatBody.scrollHeight;
    input.value = '';

    try {
        // 🔥 CORRECCIÓN AQUÍ: Agregado /api/
        const res = await fetch('/api/mensajes', {
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
            const nombre = document.getElementById('chat-header-name').textContent;
            const titulo = document.getElementById('chat-header-prop').textContent;
            window.seleccionarChat(currentChat.otroUsuarioId, currentChat.propiedadId, nombre, titulo);
            cargarConversaciones();
        }
    } catch (e) { alert("Error al enviar"); }
};