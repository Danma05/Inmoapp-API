// public/js/explorar.js - Script para la página de explorar propiedades
import { cargarPropiedades } from './propiedades.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Página Explorar iniciada');

  // 1. Cargar propiedades iniciales
  await ejecutarBusqueda();

  // 2. Configurar botón Aplicar Filtros
  const btnAplicar = document.getElementById('btn-aplicar-filtros');
  if (btnAplicar) {
    btnAplicar.addEventListener('click', (e) => {
      e.preventDefault();
      ejecutarBusqueda();
    });
  }

  // 3. Configurar ordenamiento
  const selectOrden = document.getElementById('filtro-ordenar');
  if (selectOrden) {
    selectOrden.addEventListener('change', () => ejecutarBusqueda());
  }
});

async function ejecutarBusqueda() {
  const gridContainer = document.querySelector('.grid-3-cols');
  const resultadosSpan = document.querySelector('.sort-controls-box span');

  if (!gridContainer) return;

  gridContainer.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
      <i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--primary-color);"></i>
      <p style="margin-top: 10px; color: #666;">Buscando propiedades...</p>
    </div>`;

  try {
    const filtros = obtenerFiltrosDesdeHTML();
    const data = await cargarPropiedades(filtros);
    
    if (resultadosSpan) {
      const total = data.total !== undefined ? data.total : (data.propiedades ? data.propiedades.length : 0);
      resultadosSpan.textContent = `Resultados: ${total} Propiedades`;
    }

    if (data.propiedades && data.propiedades.length > 0) {
      gridContainer.innerHTML = data.propiedades.map(prop => crearCardPropiedad(prop)).join('');
    } else {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; color: #e5e7eb; margin-bottom: 20px;"></i>
            <h3 style="color: #374151;">No encontramos propiedades</h3>
            <p style="color: #6B7280;">Intenta ajustar tus filtros.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    gridContainer.innerHTML = `<p style="text-align:center;">Error al cargar datos.</p>`;
  }
}

function obtenerFiltrosDesdeHTML() {
  const val = (id) => {
    const el = document.getElementById(id);
    return el && el.value !== "" ? el.value : null;
  };

  const params = {
    limit: 50,
    precioMin: val('filtro-precio-min'),
    precioMax: val('filtro-precio-max'),
    habitaciones: val('filtro-habitaciones'),
    banos: val('filtro-banos'),
    operacion: val('filtro-operacion'),
    tipoInmueble: val('filtro-tipo')
  };

  const ordenVal = val('filtro-ordenar');
  if (ordenVal === 'precio_canon_asc') {
    params.ordenar = 'precio_canon'; params.orden = 'ASC';
  } else if (ordenVal === 'precio_canon_desc') {
    params.ordenar = 'precio_canon'; params.orden = 'DESC';
  } else if (ordenVal) {
    params.ordenar = ordenVal; params.orden = 'DESC';
  }

  return params;
}

function crearCardPropiedad(prop) {
  const imagen = prop.thumbnail_url || prop.imagen_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400';
  const precio = prop.precio_canon || '$0';
  const direccion = prop.direccion || 'Ubicación no disponible';
  const habitaciones = prop.habitaciones || 0;
  const banos = prop.banos || 0;
  const area = prop.area_m2 || 0;
  
  const esVenta = prop.operacion === 'VENTA';
  const operacionTag = esVenta ? 'Venta' : 'Arriendo';
  const tagColor = esVenta ? 'background-color: #2563EB;' : '';

  return `
    <article class="prop-card-list">
      <div class="card-img-list">
        <span class="new-tag" style="${tagColor}">${operacionTag}</span>
        <img src="${imagen}" alt="${direccion}" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400'">
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
        
        <div style="margin-top: 15px;">
            <a href="/propiedades-detalles?id=${prop.id}" class="btn-ver-detalle" 
               style="display: block; text-align: center; background: #f3f4f6; color: #374151; padding: 8px; border-radius: 6px; text-decoration: none; font-weight: 500;">
               Ver Detalle
            </a>
        </div>
      </div>
    </article>
  `;
}