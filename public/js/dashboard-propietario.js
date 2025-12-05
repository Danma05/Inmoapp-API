import { cargarMisPropiedades, obtenerUsuario } from './propiedades.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard Propietario cargando...');

    // 1. Verificar Sesión
    currentUser = obtenerUsuario();
    if (!currentUser || !currentUser.id) {
        window.location.href = '/';
        return;
    }

    // Poner nombre en el header
    const headerName = document.getElementById('header-username');
    if (headerName) headerName.textContent = currentUser.nombre_completo.split(' ')[0];

    // 2. Cargar Propiedades
    await actualizarListaPropiedades();

    // 3. Configurar Modal de Nueva Propiedad
    configurarModalCrear();

    // 4. Configurar Logout y Tabs
    configurarEventosGlobales();
});

async function actualizarListaPropiedades() {
    const contenedor = document.getElementById('lista-mis-propiedades');
    const metricProps = document.getElementById('metric-props');
    if(!contenedor) return;

    contenedor.innerHTML = '<div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        const propiedades = await cargarMisPropiedades(currentUser.id);
        
        if (metricProps) metricProps.textContent = propiedades.length;

        if (propiedades.length > 0) {
            contenedor.innerHTML = propiedades.map(p => `
                <div class="property-row-card">
                    <img src="${p.thumbnail_url || p.imagen_url || 'https://via.placeholder.com/200'}" class="row-img" style="object-fit:cover;">
                    <div class="row-info">
                        <div class="row-header">
                            <h3>${p.tipo_inmueble} - ${p.operacion}</h3>
                            <span class="status-badge published">PUBLICADO</span>
                        </div>
                        <p class="row-address"><i class="fa-solid fa-location-dot"></i> ${p.direccion}</p>
                        <div class="row-stats">
                            <span><i class="fa-solid fa-bed"></i> ${p.habitaciones}</span>
                            <span><i class="fa-solid fa-ruler"></i> ${p.area_m2} m²</span>
                            <span class="price">${p.precio_canon}</span>
                        </div>
                    </div>
                    <div class="row-actions">
                        <button class="btn-icon delete" onclick="eliminarPropiedad(${p.id})">
                            <i class="fa-regular fa-trash-can" style="color:red;"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            contenedor.innerHTML = '<p style="text-align:center; padding:40px;">No tienes propiedades publicadas aún.</p>';
        }
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p style="color:red; text-align:center;">Error al cargar propiedades. (Revisa tu conexión)</p>';
    }
}

// Función Global para Eliminar
window.eliminarPropiedad = async (id) => {
    if(!confirm("¿Borrar esta propiedad permanentemente?")) return;
    try {
        const token = localStorage.getItem('inmoapp_token');
        const res = await fetch(`/propiedades/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            alert("Eliminada correctamente");
            actualizarListaPropiedades();
        } else {
            alert("No se pudo eliminar");
        }
    } catch(e) { console.error(e); }
};

function configurarModalCrear() {
    const modal = document.getElementById('new-property-modal');
    const btnOpen = document.getElementById('btn-new-property-main');
    const form = document.getElementById('form-new-property');
    const closeBtns = document.querySelectorAll('#close-new-prop, #cancel-new-prop');

    if(btnOpen) btnOpen.onclick = () => modal.classList.remove('hidden');
    closeBtns.forEach(b => b.onclick = () => modal.classList.add('hidden'));

    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('submit-new-prop');
            btnSubmit.innerHTML = 'Publicando...';
            btnSubmit.disabled = true;

            const formData = new FormData(form);
            // El backend ya lo pone en PUBLICADO por defecto, no necesitamos enviar nada extra

            try {
                const token = localStorage.getItem('inmoapp_token');
                const res = await fetch('/propiedades', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if(res.ok) {
                    alert("✅ ¡Propiedad publicada exitosamente!");
                    form.reset();
                    modal.classList.add('hidden');
                    actualizarListaPropiedades();
                } else {
                    const err = await res.json();
                    alert("Error: " + err.error);
                }
            } catch(e) {
                alert("Error de conexión");
            } finally {
                btnSubmit.innerHTML = 'Publicar';
                btnSubmit.disabled = false;
            }
        };
    }
}

function configurarEventosGlobales() {
    // Tabs
    document.querySelectorAll('.nav-link').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            document.querySelectorAll('.dashboard-view').forEach(v => v.classList.add('hidden'));
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            
            const target = link.getAttribute('data-tab');
            document.getElementById('view-'+target).classList.remove('hidden');
            link.classList.add('active');
        };
    });

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout) {
        btnLogout.onclick = () => {
            localStorage.removeItem('inmoapp_user');
            localStorage.removeItem('inmoapp_token');
            window.location.href = '/';
        };
    }
    
    // Perfil Dropdown
    const btnProfile = document.getElementById('user-profile-btn');
    if(btnProfile) {
        btnProfile.onclick = () => {
            document.getElementById('user-dropdown').classList.toggle('hidden');
        }
    }
}