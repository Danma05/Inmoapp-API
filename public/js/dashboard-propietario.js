// js/dashboard-propietario.js

// Importamos las funciones necesarias desde propiedades.js y solicitudes.js
import { cargarMisPropiedades, crearPropiedad, renderizarPropiedades } from './propiedades.js';
import { initSolicitudes } from './solicitudes.js';

// Configuración
const USUARIO_ID = 53; 
const API_URL = 'https://inmoapp-api.onrender.com';

// Esperamos a que el DOM cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Dashboard Propietario: DOM cargado.");
    initDashboard();
});

function initDashboard() {
    // 1. Cargar contadores iniciales
    cargarResumen();
    // 2. Configurar pestañas (navegación lateral)
    setupTabs();
    // 3. Configurar el modal de publicación (Botón Crear)
    setupModalPropiedad();
    // 4. Configurar menús del header (Usuario/Notificaciones)
    setupHeaderDropdowns();
}

// ==========================================
// 1. LÓGICA DE NAVEGACIÓN (TABS)
// ==========================================
function setupTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.dashboard-view');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // UI: Actualizar clase active en el menú
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // UI: Mostrar la sección correcta y ocultar las demás
            const tabId = link.dataset.tab;
            sections.forEach(s => s.classList.add('hidden'));
            
            const seccionActiva = document.getElementById(`view-${tabId}`);
            if (seccionActiva) {
                seccionActiva.classList.remove('hidden');
            }

            // LÓGICA: Cargar datos según la pestaña
            switch(tabId) {
                case 'resumen':
                    pageTitle.textContent = 'Panel de Control';
                    cargarResumen();
                    break;

                case 'propiedades':
                    pageTitle.textContent = 'Mis Propiedades';
                    const contenedorProps = document.getElementById('lista-mis-propiedades');
                    
                    // 1. Mostrar estado de carga
                    contenedorProps.innerHTML = '<p style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando propiedades...</p>';
                    
                    // 2. Pedir datos a la API
                    const misProps = await cargarMisPropiedades(USUARIO_ID);
                    
                    // 3. Renderizar los datos (ESTO ES LO QUE FALTABA ANTES)
                    renderizarPropiedades(misProps, 'lista-mis-propiedades', 'row');
                    break;

                case 'solicitudes':
                    pageTitle.textContent = 'Gestión de Solicitudes';
                    initSolicitudes(USUARIO_ID);
                    break;

                case 'contratos':
                    pageTitle.textContent = 'Mis Contratos';
                    break;

                case 'mensajes':
                    pageTitle.textContent = 'Mensajería';
                    break;
            }
        });
    });
}

// ==========================================
// 2. LÓGICA DEL MODAL (NUEVA PROPIEDAD)
// ==========================================
function setupModalPropiedad() {
    const btnOpen = document.getElementById('btn-new-property-main');
    const modal = document.getElementById('new-property-modal');
    const btnClose = document.getElementById('close-new-prop');
    const btnCancel = document.getElementById('cancel-new-prop');
    const form = document.getElementById('form-new-property');

    // Validación: Si el botón no existe, salimos para no causar errores
    if (!btnOpen) {
        console.warn("⚠️ Botón 'btn-new-property-main' no encontrado en el HTML.");
        return;
    }

    // ABRIR MODAL
    btnOpen.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("🖱️ Abriendo modal de publicación...");
        modal.classList.remove('hidden');
    });

    // FUNCION CERRAR
    const cerrarModal = () => {
        modal.classList.add('hidden');
        if(form) form.reset(); 
    };

    if(btnClose) btnClose.addEventListener('click', cerrarModal);
    if(btnCancel) btnCancel.addEventListener('click', cerrarModal);

    // Cerrar al dar click fuera del modal
    if(modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
    }

    // ENVIAR FORMULARIO
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("🚀 Enviando datos de propiedad...");
            
            const formData = new FormData(form);
            
            // Construir objeto JSON
            const nuevaPropiedad = {
                propietarioId: USUARIO_ID,
                titulo: `${formData.get('tipoInmueble')} en ${formData.get('direccion')}`,
                tipo: formData.get('tipoInmueble'),
                operacion: formData.get('operacion'),
                direccion: formData.get('direccion'),
                habitaciones: parseInt(formData.get('habitaciones')) || 0,
                banos: parseInt(formData.get('banos')) || 0,
                area_m2: parseInt(formData.get('areaM2')) || 0,
                descripcion: formData.get('descripcion'),
                precio_canon: parseFloat(formData.get('precioCanon').replace(/[^0-9.]/g, '')) || 0,
                imagen_url: formData.get('imagenUrl') || 'https://via.placeholder.com/300x200?text=Sin+Imagen'
            };

            const exito = await crearPropiedad(nuevaPropiedad);

            if (exito) {
                alert('¡Propiedad publicada correctamente!');
                cerrarModal();
                
                // Si estamos viendo la lista, recargarla
                const activeTab = document.querySelector('.nav-link.active');
                if (activeTab && activeTab.dataset.tab === 'propiedades') {
                    const props = await cargarMisPropiedades(USUARIO_ID);
                    renderizarPropiedades(props, 'lista-mis-propiedades', 'row');
                }
                
                // Actualizar contador del resumen
                cargarResumen();
            }
        });
    }
}

// ==========================================
// 3. HEADER INTERACTIVO
// ==========================================
function setupHeaderDropdowns() {
    const btnBell = document.getElementById('btn-bell');
    const notifMenu = document.getElementById('notif-menu');
    const btnUser = document.getElementById('user-profile-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const btnLogout = document.getElementById('btn-logout');

    if(btnBell && notifMenu) {
        btnBell.addEventListener('click', (e) => {
            e.stopPropagation();
            notifMenu.classList.toggle('hidden');
            if(userDropdown) userDropdown.classList.add('hidden');
        });
    }

    if(btnUser && userDropdown) {
        btnUser.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
            if(notifMenu) notifMenu.classList.add('hidden');
        });
    }

    if(btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm('¿Deseas cerrar sesión?')) {
                window.location.href = '/login.html';
            }
        });
    }

    // Cerrar menús al hacer click fuera
    document.addEventListener('click', () => {
        if(notifMenu) notifMenu.classList.add('hidden');
        if(userDropdown) userDropdown.classList.add('hidden');
    });
}

// ==========================================
// 4. DATOS RESUMEN
// ==========================================
async function cargarResumen() {
    const metricProps = document.getElementById('metric-props');
    if(!metricProps) return;

    try {
        const res = await fetch(`${API_URL}/propiedades?propietarioId=${USUARIO_ID}`);
        if(res.ok) {
            const props = await res.json();
            metricProps.textContent = props.length;
        }
    } catch (error) {
        console.error("Error cargando métricas:", error);
        metricProps.textContent = "-";
    }
}