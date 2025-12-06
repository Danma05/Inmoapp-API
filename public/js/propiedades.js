// js/dashboard-propietario.js

// 1. IMPORTANTE: Agregamos 'renderizarPropiedades' al import
import { cargarMisPropiedades, crearPropiedad, renderizarPropiedades } from './propiedades.js';
import { initSolicitudes } from './solicitudes.js';

const USUARIO_ID = 53; 
const API_URL = 'https://inmoapp-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

function initDashboard() {
    console.log('Iniciando Dashboard Propietario...');
    cargarResumen();
    setupTabs();
    setupModalPropiedad();
    setupHeaderDropdowns();
}

// ==========================================
// 1. LÓGICA DE NAVEGACIÓN (TABS) - CORREGIDA
// ==========================================
function setupTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.dashboard-view');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => { // Hacemos la función async
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const tabId = link.dataset.tab;
            sections.forEach(s => s.classList.add('hidden'));
            document.getElementById(`view-${tabId}`).classList.remove('hidden');

            switch(tabId) {
                case 'resumen':
                    pageTitle.textContent = 'Panel de Control';
                    cargarResumen();
                    break;

                case 'propiedades':
                    pageTitle.textContent = 'Mis Propiedades';
                    // --- CORRECCIÓN AQUÍ ---
                    // Mostramos "Cargando..." antes de pedir los datos
                    document.getElementById('lista-mis-propiedades').innerHTML = '<p style="text-align: center; padding: 40px;">Cargando propiedades...</p>';
                    
                    // Pedimos los datos
                    const misProps = await cargarMisPropiedades(USUARIO_ID);
                    
                    // Los dibujamos en pantalla usando el modo 'row' (lista horizontal)
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

// ... (El resto del código setupModalPropiedad, setupHeaderDropdowns, cargarResumen queda IGUAL) ...

// ==========================================
// 2. LÓGICA DEL MODAL (NUEVA PROPIEDAD)
// ==========================================
function setupModalPropiedad() {
    const modal = document.getElementById('new-property-modal');
    const btnOpen = document.getElementById('btn-new-property-main');
    const btnClose = document.getElementById('close-new-prop');
    const btnCancel = document.getElementById('cancel-new-prop');
    const form = document.getElementById('form-new-property');

    if(btnOpen) {
        btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
    }

    const cerrarModal = () => {
        modal.classList.add('hidden');
        form.reset(); 
    };

    if(btnClose) btnClose.addEventListener('click', cerrarModal);
    if(btnCancel) btnCancel.addEventListener('click', cerrarModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const nuevaPropiedad = {
            propietarioId: USUARIO_ID,
            titulo: `${formData.get('tipoInmueble')} en ${formData.get('direccion')}`,
            tipo: formData.get('tipoInmueble'),
            operacion: formData.get('operacion'),
            direccion: formData.get('direccion'),
            habitaciones: parseInt(formData.get('habitaciones')) || 0,
            banos: parseInt(formData.get('banos')) || 0,
            area_m2: parseInt(formData.get('areaM2')) || 0, // Ojo: asegurate que el nombre coincida con tu backend (area vs area_m2)
            descripcion: formData.get('descripcion'),
            precio_canon: parseFloat(formData.get('precioCanon').replace(/[^0-9.]/g, '')) || 0,
            imagen_url: formData.get('imagenUrl') || 'https://via.placeholder.com/300x200?text=Sin+Imagen'
        };

        const exito = await crearPropiedad(nuevaPropiedad);

        if (exito) {
            cerrarModal();
            const activeTab = document.querySelector('.nav-link.active').dataset.tab;
            if (activeTab === 'propiedades') {
                // Recargar la lista manualmente si estamos en esa pestaña
                const misProps = await cargarMisPropiedades(USUARIO_ID);
                renderizarPropiedades(misProps, 'lista-mis-propiedades', 'row');
            } else {
                alert('Propiedad publicada correctamente.');
            }
            cargarResumen();
        }
    });
}

function setupHeaderDropdowns() {
    const btnBell = document.getElementById('btn-bell');
    const notifMenu = document.getElementById('notif-menu');
    
    if(btnBell) {
        btnBell.addEventListener('click', (e) => {
            e.stopPropagation();
            notifMenu.classList.toggle('hidden');
        });
    }

    const btnUser = document.getElementById('user-profile-btn');
    const userDropdown = document.getElementById('user-dropdown');

    if(btnUser) {
        btnUser.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm('¿Cerrar sesión?')) window.location.href = '/login.html';
        });
    }

    document.addEventListener('click', () => {
        if(notifMenu) notifMenu.classList.add('hidden');
        if(userDropdown) userDropdown.classList.add('hidden');
    });
}

async function cargarResumen() {
    const metricProps = document.getElementById('metric-props');
    try {
        const res = await fetch(`${API_URL}/propiedades?propietarioId=${USUARIO_ID}`);
        if(res.ok) {
            const props = await res.json();
            if(metricProps) metricProps.textContent = props.length;
        }
    } catch (error) {
        console.error("Error metrics:", error);
    }
}