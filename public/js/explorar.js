// public/js/explorar.js - Script para la página de explorar propiedades
import { cargarPropiedades, renderizarPropiedades } from './propiedades.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Cargando página de explorar...');

  const gridContainer = document.querySelector('.grid-3-cols');
  const resultadosSpan = document.querySelector('.sort-controls-box span');
  
  if (!gridContainer) {
    console.error('❌ No se encontró el contenedor de propiedades');
    return;
  }

  // Mostrar loading
  gridContainer.innerHTML = '<p style="text-align: center; padding: 40px;">Cargando propiedades...</p>';

  try {
    // Cargar propiedades
    const data = await cargarPropiedades({ limit: 50 });
    
    if (data && data.propiedades) {
      // Actualizar contador
      if (resultadosSpan) {
        resultadosSpan.textContent = `Resultados: ${data.total || data.propiedades.length} Propiedades`;
      }

      // Renderizar propiedades
      if (data.propiedades.length > 0) {
        gridContainer.innerHTML = data.propiedades.map(prop => crearCardPropiedad(prop)).join('');
      } else {
        gridContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #6B7280;">No se encontraron propiedades.</p>';
      }
    } else {
      gridContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #6B7280;">Error al cargar propiedades.</p>';
    }
  } catch (error) {
    console.error('❌ Error:', error);
    gridContainer.innerHTML = `<p style="text-align: center; padding: 40px; color: #DC2626;">Error: ${error.message}</p>`;
  }
});

function crearCardPropiedad(prop) {
  const imagen = prop.imagen_url || 'https://images.unsplash.com/photo-1549419192-333d1c255e4e?auto=format&fit=crop&w=400';
  const precio = prop.precio_canon || '$0';
  const direccion = prop.direccion || 'Dirección no disponible';
  const habitaciones = prop.habitaciones || 0;
  const banos = prop.banos || 0;
  const area = prop.area_m2 || 0;

  return `
    <article class="prop-card-list">
      <div class="card-img-list">
        <span class="new-tag">Nuevo!</span>
        <img src="${imagen}" alt="${direccion}" onerror="this.src='https://images.unsplash.com/photo-1549419192-333d1c255e4e?auto=format&fit=crop&w=400'">
        <button class="fav-btn" data-propiedad-id="${prop.id}">
          <i class="fa-regular fa-heart"></i>
        </button>
      </div>
      <div class="card-info-list">
        <div class="price-red">${precio}</div>
        <h3>${direccion}</h3>
        <p class="location-list">
          <i class="fa-solid fa-location-dot"></i> ${direccion}
        </p>
        <div class="specs-list">
          <span><i class="fa-solid fa-bed"></i> ${habitaciones}</span>
          <span><i class="fa-solid fa-bath"></i> ${banos}</span>
          <span><i class="fa-solid fa-maximize"></i> ${area} m²</span>
        </div>
      </div>
    </article>
  `;
}

