import { cargarMisPropiedades, crearPropiedad } from './propiedades.js';
import { initSolicitudes } from './solicitudes.js';

// --- CONFIGURACIÓN Y ESTADO ---
const USUARIO_ID = 53; // ID fijo para pruebas (en producción vendría del login/token)
const API_URL = 'https://inmoapp-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

function initDashboard() {
    console.log('Iniciando Dashboard Propietario...');
    
    // 1. Cargar datos iniciales (Resumen)
    cargarResumen();

    // 2. Configurar Navegación (Tabs)
    setupTabs();

    // 3. Configurar Modal de Nueva Propiedad
    setupModalPropiedad();

    // 4. Configurar Menús del Header (Notificaciones y Usuario)
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
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 1. UI: Actualizar clases active
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // 2. UI: Mostrar sección correspondiente
            const tabId = link.dataset.tab;
            sections.forEach(s => s.classList.add('hidden'));
            document.getElementById(`view-${tabId}`).classList.remove('hidden');

            // 3. LÓGICA: Cargar datos según la pestaña
            switch(tabId) {
                case 'resumen':
                    pageTitle.textContent = 'Panel de Control';
                    cargarResumen();
                    break;
                case 'propiedades':
                    pageTitle.textContent = 'Mis Propiedades';
                    cargarMisPropiedades(USUARIO_ID);
                    break;
                case 'solicitudes':
                    pageTitle.textContent = 'Gestión de Solicitudes';
                    initSolicitudes(USUARIO_ID);
                    break;
                case 'contratos':
                    pageTitle.textContent = 'Mis Contratos';
                    // cargarContratos(USUARIO_ID); // Futura implementación
                    break;
                case 'mensajes':
                    pageTitle.textContent = 'Mensajería';
                    // cargarMensajes(USUARIO_ID); // Futura implementación
                    break;
            }
        });
    });
}

// ==========================================
// 2. LÓGICA DEL MODAL (NUEVA PROPIEDAD)
// ==========================================
function setupModalPropiedad() {
    const modal = document.getElementById('new-property-modal');
    const btnOpen = document.getElementById('btn-new-property-main');
    const btnClose = document.getElementById('close-new-prop');
    const btnCancel = document.getElementById('cancel-new-prop');
    const form = document.getElementById('form-new-property');

    // Abrir
    btnOpen.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    // Cerrar
    const cerrarModal = () => {
        modal.classList.add('hidden');
        form.reset(); // Limpiar formulario al cerrar
    };

    btnClose.addEventListener('click', cerrarModal);
    btnCancel.addEventListener('click', cerrarModal);

    // Cerrar al hacer clic fuera del contenido
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    // Enviar Formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Recopilar datos del formulario
        const formData = new FormData(form);
        const nuevaPropiedad = {
            propietarioId: USUARIO_ID,
            titulo: `${formData.get('tipoInmueble')} en ${formData.get('direccion')}`, // Generamos un título automático
            tipo: formData.get('tipoInmueble'),
            operacion: formData.get('operacion'),
            direccion: formData.get('direccion'),
            habitaciones: parseInt(formData.get('habitaciones')) || 0,
            banos: parseInt(formData.get('banos')) || 0,
            area: parseInt(formData.get('areaM2')) || 0,
            descripcion: formData.get('descripcion'),
            precio: parseFloat(formData.get('precioCanon').replace(/[^0-9.]/g, '')) || 0, // Limpiar símbolo $ si el usuario lo pone
            imagen: formData.get('imagenUrl') || 'https://via.placeholder.com/300x200?text=Sin+Imagen'
        };

        // Enviar a la API (usando la función importada de propiedades.js)
        const exito = await crearPropiedad(nuevaPropiedad);

        if (exito) {
            cerrarModal();
            // Si estamos en la vista de propiedades, recargar
            const activeTab = document.querySelector('.nav-link.active').dataset.tab;
            if (activeTab === 'propiedades') {
                cargarMisPropiedades(USUARIO_ID);
            } else {
                alert('Propiedad publicada correctamente.');
            }
            // Actualizar métricas del resumen
            cargarResumen();
        }
    });
}

// ==========================================
// 3. HEADER INTERACTIVO
// ==========================================
function setupHeaderDropdowns() {
    // Notificaciones
    const btnBell = document.getElementById('btn-bell');
    const notifMenu = document.getElementById('notif-menu');
    
    btnBell.addEventListener('click', (e) => {
        e.stopPropagation();
        notifMenu.classList.toggle('hidden');
        userDropdown.classList.add('hidden'); // Cerrar el otro si está abierto
    });

    // Usuario
    const btnUser = document.getElementById('user-profile-btn');
    const userDropdown = document.getElementById('user-dropdown');

    btnUser.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
        notifMenu.classList.add('hidden'); // Cerrar el otro si está abierto
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm('¿Cerrar sesión?')) {
            window.location.href = '/login.html'; // Redirigir
        }
    });

    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', () => {
        notifMenu.classList.add('hidden');
        userDropdown.classList.add('hidden');
    });
}

// ==========================================
// 4. DATOS DE RESUMEN (MÉTRICAS)
// ==========================================
async function cargarResumen() {
    // Aquí actualizamos los números de las tarjetas del Dashboard
    const metricProps = document.getElementById('metric-props');
    
    try {
        // Obtenemos las propiedades para contar cuántas hay
        const res = await fetch(`${API_URL}/propiedades?propietarioId=${USUARIO_ID}`);
        if(res.ok) {
            const props = await res.json();
            metricProps.textContent = props.length;
        }
    } catch (error) {
        console.error("Error cargando métricas resumen:", error);
        metricProps.textContent = "-";
    }

    // Nota: Para "Ingresos Mes" y "Pendientes", necesitarías endpoints específicos
    // o calcularlos sumando datos en el frontend.
}