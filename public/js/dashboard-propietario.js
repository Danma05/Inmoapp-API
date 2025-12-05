// public/js/dashboard-propietario.js
import { cargarMisPropiedades, obtenerUsuario } from './propiedades.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Cargando dashboard propietario...');

    // 1. VERIFICAR USUARIO
    currentUser = obtenerUsuario();
    if (!currentUser || !currentUser.id) {
        console.error('❌ No hay usuario logueado o token inválido');
        window.location.href = '/';
        return;
    }

    // Actualizar nombre en el header
    const headerName = document.getElementById('header-username');
    const avatarCircle = document.querySelector('.avatar-circle');
    if(headerName) headerName.textContent = currentUser.nombre_completo.split(' ')[0];
    if(avatarCircle) avatarCircle.textContent = (currentUser.nombre_completo[0] || 'U').toUpperCase();

    // 2. CONFIGURAR TABS (Navegación lateral)
    configurarTabs();

    // 3. CARGAR PROPIEDADES INICIALES
    await actualizarListaPropiedades();

    // 4. CONFIGURAR MODAL "PUBLICAR PROPIEDAD"
    configurarModalPublicar();

    // 5. CONFIGURAR DROPDOWNS (Perfil y Notificaciones)
    configurarDropdowns();
});

// --- GESTIÓN DE TABS ---
function configurarTabs() {
    const links = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.dashboard-view');
    const pageTitle = document.getElementById('page-title');
    const btnNew = document.getElementById('btn-new-property-main');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // UI Update
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // View Switch
            const targetId = link.getAttribute('data-tab');
            views.forEach(v => v.classList.add('hidden'));
            const targetView = document.getElementById('view-' + targetId);
            if(targetView) targetView.classList.remove('hidden');

            // Actualizar Título
            if(pageTitle) pageTitle.textContent = link.textContent.trim();

            // Mostrar/Ocultar botón de crear según la vista
            if(btnNew) {
                btnNew.style.display = (targetId === 'propiedades' || targetId === 'resumen') ? 'flex' : 'none';
            }

            // Si entra a propiedades, recargar lista
            if (targetId === 'propiedades') {
                actualizarListaPropiedades();
            }
        });
    });
}

// --- CARGAR PROPIEDADES ---
async function actualizarListaPropiedades() {
    const contenedor = document.getElementById('lista-mis-propiedades');
    const metricProps = document.getElementById('metric-props');
    if (!contenedor) return;

    contenedor.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        const propiedades = await cargarMisPropiedades(currentUser.id);
        
        // Actualizar métrica en resumen
        if(metricProps) metricProps.textContent = propiedades.length;

        if (propiedades && propiedades.length > 0) {
            contenedor.innerHTML = propiedades.map(prop => crearHTMLPropiedadFila(prop)).join('');
            
            // Asignar eventos a los botones de eliminar
            document.querySelectorAll('.btn-delete-prop').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    eliminarPropiedad(id);
                });
            });

        } else {
            contenedor.innerHTML = `
                <div class="empty-state-panel">
                    <i class="fa-solid fa-house-chimney" style="font-size: 3rem; color: #e5e7eb; margin-bottom: 15px;"></i>
                    <h3>No has publicado propiedades</h3>
                    <p>Usa el botón "Publicar Inmueble" para comenzar.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando propiedades:', error);
        contenedor.innerHTML = '<p style="color:red; text-align:center;">Error al cargar datos.</p>';
    }
}

function crearHTMLPropiedadFila(prop) {
    const imagen = prop.thumbnail_url || prop.imagen_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=200';
    // Estado por defecto EN REVISIÓN a menos que sea explícitamente PUBLICADO
    const estado = prop.estado_publicacion === 'PUBLICADO' ? 'published' : 'review';
    const estadoTexto = prop.estado_publicacion === 'PUBLICADO' ? 'Publicado' : 'En Revisión';
    
    return `
      <div class="property-row-card">
        <img src="${imagen}" class="row-img" alt="${prop.direccion}" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=200'">
        <div class="row-info">
          <div class="row-header">
            <h3>${prop.tipo_inmueble} - ${prop.operacion}</h3>
            <span class="status-badge ${estado}">${estadoTexto}</span>
          </div>
          <p class="row-address">
            <i class="fa-solid fa-location-dot"></i> ${prop.direccion}
          </p>
          <div class="row-stats">
            <span><i class="fa-solid fa-bed"></i> ${prop.habitaciones} Hab</span>
            <span><i class="fa-solid fa-ruler"></i> ${prop.area_m2} m²</span>
            <span class="price">${prop.precio_canon}</span>
          </div>
        </div>
        <div class="row-actions">
          <button class="btn-icon" title="Editar (Próximamente)">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon delete btn-delete-prop" data-id="${prop.id}" title="Eliminar" style="border-color:#FEE2E2; color:#DC2626;">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
}

// --- ELIMINAR PROPIEDAD ---
async function eliminarPropiedad(id) {
    if(!confirm("¿Estás seguro de eliminar esta propiedad? Esta acción no se puede deshacer.")) return;

    try {
        const token = localStorage.getItem('inmoapp_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`/propiedades/${id}`, {
            method: 'DELETE',
            headers: headers
        });

        if(res.ok) {
            alert("Propiedad eliminada correctamente.");
            actualizarListaPropiedades();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "No se pudo eliminar"));
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión");
    }
}

// --- PUBLICAR PROPIEDAD ---
function configurarModalPublicar() {
    const modal = document.getElementById('new-property-modal');
    const btnOpen = document.getElementById('btn-new-property-main');
    const btnsClose = [document.getElementById('close-new-prop'), document.getElementById('cancel-new-prop')];
    const form = document.getElementById('form-new-property');
    const submitBtn = document.getElementById('submit-new-prop');

    if(btnOpen) btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
    
    btnsClose.forEach(btn => {
        if(btn) btn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('hidden');
        });
    });

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validaciones básicas
            const precio = document.getElementById('prop-precio').value;
            const direccion = document.getElementById('prop-direccion').value;
            
            if(!precio || !direccion) {
                alert("Precio y Dirección son obligatorios.");
                return;
            }

            // Preparar FormData (para soportar archivos si los hubiera)
            const formData = new FormData(form);
            formData.append('usuarioId', currentUser.id); // Fallback ID
            formData.append('autoPublish', 'true'); // Publicar directo para demo

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publicando...';

            try {
                const token = localStorage.getItem('inmoapp_token');
                const headers = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch('/propiedades', {
                    method: 'POST',
                    headers: headers, // fetch añade boundary automáticamente para FormData
                    body: formData
                });

                const data = await res.json();

                if(res.ok) {
                    alert("¡Propiedad publicada con éxito!");
                    form.reset();
                    modal.classList.add('hidden');
                    actualizarListaPropiedades(); // Refrescar lista
                } else {
                    alert("Error: " + (data.error || "No se pudo publicar"));
                }
            } catch (err) {
                console.error(err);
                alert("Error de conexión con el servidor.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publicar';
            }
        });
    }
}

// --- DROPDOWNS Y LOGOUT ---
function configurarDropdowns() {
    const btnUser = document.getElementById('user-profile-btn');
    const menuUser = document.getElementById('user-dropdown');
    const btnBell = document.getElementById('btn-bell');
    const menuNotif = document.getElementById('notif-menu');
    const btnLogout = document.getElementById('btn-logout');

    if(btnUser && menuUser) {
        btnUser.addEventListener('click', (e) => {
            e.stopPropagation();
            menuUser.classList.toggle('hidden');
            if(menuNotif) menuNotif.classList.add('hidden');
        });
    }

    if(btnBell && menuNotif) {
        btnBell.addEventListener('click', (e) => {
            e.stopPropagation();
            menuNotif.classList.toggle('hidden');
            if(menuUser) menuUser.classList.add('hidden');
        });
    }

    document.addEventListener('click', () => {
        if(menuUser) menuUser.classList.add('hidden');
        if(menuNotif) menuNotif.classList.add('hidden');
    });

    if(btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('inmoapp_user');
            localStorage.removeItem('inmoapp_token');
            window.location.href = '/';
        });
    }
}