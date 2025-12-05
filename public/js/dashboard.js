// public/js/dashboard.js - Script para el dashboard del arrendatario
import { cargarPropiedades } from './propiedades.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Cargando dashboard...');

  // Cargar propiedades destacadas
  const gridDestacadas = document.querySelector('.grid-2-cols');
  const gridRecientes = document.querySelector('.grid-4-cols');

  try {
    // Cargar propiedades destacadas (últimas 2)
    const dataDestacadas = await cargarPropiedades({ limit: 2, ordenar: 'creado_en', orden: 'DESC' });
    
    if (gridDestacadas && dataDestacadas && dataDestacadas.propiedades) {
      if (dataDestacadas.propiedades.length > 0) {
        gridDestacadas.innerHTML = dataDestacadas.propiedades.map(prop => crearCardDestacada(prop)).join('');
      }
    }

    // Cargar propiedades recientes (últimas 4)
    const dataRecientes = await cargarPropiedades({ limit: 4, ordenar: 'creado_en', orden: 'DESC' });
    
    if (gridRecientes && dataRecientes && dataRecientes.propiedades) {
      if (dataRecientes.propiedades.length > 0) {
        gridRecientes.innerHTML = dataRecientes.propiedades.map(prop => crearCardReciente(prop)).join('');
      }
    }
  } catch (error) {
    console.error('❌ Error cargando propiedades:', error);
  }
});

function crearCardDestacada(prop) {
  const imagen = prop.imagen_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800';
  const precio = prop.precio_canon || '$0';
  const direccion = prop.direccion || 'Dirección no disponible';
  const habitaciones = prop.habitaciones || 0;
  const banos = prop.banos || 0;
  const area = prop.area_m2 || 0;

  return `
    <article class="prop-card-lg">
      <div class="card-img">
        <img src="${imagen}" alt="${direccion}" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800'">
      </div>
      <div class="card-info">
        <div class="price-red">${precio}</div>
        <h3>${direccion}</h3>
        <p class="location">
          <i class="fa-solid fa-location-dot"></i> ${direccion}
        </p>
        <div class="specs">
          <span>${habitaciones} habitaciones</span> • <span>${banos} baños</span> • <span>${area} m²</span>
        </div>
      </div>
    </article>
  `;
}

function crearCardReciente(prop) {
  const imagen = prop.imagen_url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400';
  const precio = prop.precio_canon || '$0';
  const direccion = prop.direccion || 'Dirección no disponible';

  return `
    <article class="prop-card-sm">
      <div class="card-img-sm">
        <img src="${imagen}" alt="${direccion}" onerror="this.src='https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400'">
        <button class="fav-btn" data-propiedad-id="${prop.id}">
          <i class="fa-regular fa-heart"></i>
        </button>
      </div>
      <div class="card-info-sm">
        <div class="price-red">${precio}</div>
        <h3>${direccion}</h3>
        <p class="location">
          <i class="fa-solid fa-location-dot"></i> ${direccion}
        </p>
      </div>
    </article>
  `;
}

