// public/js/dashboard-propietario.js - Script para el dashboard del propietario
import { cargarMisPropiedades, obtenerUsuario } from './propiedades.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Cargando dashboard propietario...');

  const usuario = obtenerUsuario();
  
  if (!usuario) {
    console.error('❌ No hay usuario logueado');
    window.location.href = '/';
    return;
  }

  // Cargar mis propiedades cuando se muestra la vista
  const propiedadesContainer = document.querySelector('.properties-list-vertical');
  const viewPropiedades = document.getElementById('view-propiedades');

  if (propiedadesContainer && viewPropiedades) {
    // Observar cuando se muestra la vista
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isVisible = !viewPropiedades.classList.contains('hidden');
          if (isVisible && propiedadesContainer.children.length === 0) {
            cargarPropiedadesDelPropietario(usuario.id, propiedadesContainer);
          }
        }
      });
    });

    observer.observe(viewPropiedades, { attributes: true });

    // Cargar si ya está visible
    if (!viewPropiedades.classList.contains('hidden')) {
      cargarPropiedadesDelPropietario(usuario.id, propiedadesContainer);
    }
  }
});

async function cargarPropiedadesDelPropietario(usuarioId, contenedor) {
  if (!contenedor) return;

  contenedor.innerHTML = '<p style="text-align: center; padding: 40px;">Cargando propiedades...</p>';

  try {
    const propiedades = await cargarMisPropiedades(usuarioId);
    
    if (propiedades && propiedades.length > 0) {
      contenedor.innerHTML = propiedades.map(prop => crearCardPropiedadFila(prop)).join('');
    } else {
      contenedor.innerHTML = '<p style="text-align: center; padding: 40px; color: #6B7280;">No tienes propiedades registradas aún.</p>';
    }
  } catch (error) {
    console.error('❌ Error cargando propiedades:', error);
    contenedor.innerHTML = `<p style="text-align: center; padding: 40px; color: #DC2626;">Error: ${error.message}</p>`;
  }
}

function crearCardPropiedadFila(prop) {
  const imagen = prop.imagen_url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200';
  const precio = prop.precio_canon || '$0';
  const direccion = prop.direccion || 'Dirección no disponible';
  const habitaciones = prop.habitaciones || 0;
  const banos = prop.banos || 0;
  const area = prop.area_m2 || 0;
  const estado = prop.activa ? 'published' : 'review';
  const estadoTexto = prop.activa ? 'Publicado' : 'En Revisión';

  return `
    <div class="property-row-card">
      <img src="${imagen}" class="row-img" alt="${direccion}" onerror="this.src='https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200'">
      <div class="row-info">
        <div class="row-header">
          <h3>${direccion}</h3>
          <span class="status-badge ${estado}">${estadoTexto}</span>
        </div>
        <p class="row-address">
          <i class="fa-solid fa-location-dot"></i> ${direccion}
        </p>
        <div class="row-stats">
          <span><i class="fa-solid fa-bed"></i> ${habitaciones} Hab</span>
          <span><i class="fa-solid fa-ruler"></i> ${area} m²</span>
          <span class="price">${precio}</span>
        </div>
      </div>
      <div class="row-actions">
        <button class="btn-icon" data-propiedad-id="${prop.id}">
          <i class="fa-solid fa-pen"></i>
        </button>
      </div>
    </div>
  `;
}

