// public/js/explorar.js - Script para la página de explorar propiedades
import { cargarPropiedades } from './propiedades.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Página Explorar iniciada');

  // 1. Cargar propiedades iniciales (sin filtros al abrir la página)
  await ejecutarBusqueda();

  // 2. Configurar el botón "Aplicar Filtros"
  const btnAplicar = document.getElementById('btn-aplicar-filtros');
  if (btnAplicar) {
    btnAplicar.addEventListener('click', (e) => {
      e.preventDefault(); // Evita comportamientos extraños del formulario
      console.log('🖱️ Botón Aplicar Filtros presionado');
      ejecutarBusqueda();
    });
  } else {
    console.warn('⚠️ No se encontró el botón con id="btn-aplicar-filtros"');
  }

  // 3. Configurar el cambio de ordenamiento automático (si existe el select)
  const selectOrden = document.getElementById('filtro-ordenar');
  if (selectOrden) {
    selectOrden.addEventListener('change', () => {
      console.log('🔄 Cambio de orden detectado');
      ejecutarBusqueda();
    });
  }
});

/**
 * Función central que lee los filtros, llama a la API y pinta la grilla
 */
async function ejecutarBusqueda() {
  const gridContainer = document.querySelector('.grid-3-cols');
  const resultadosSpan = document.querySelector('.sort-controls-box span');

  if (!gridContainer) return;

  // Mostrar spinner de carga mientras esperamos
  gridContainer.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
      <i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--primary-color);"></i>
      <p style="margin-top: 10px; color: #666;">Buscando propiedades...</p>
    </div>`;

  try {
    // A. Recoger valores del HTML
    const filtros = obtenerFiltrosDesdeHTML();
    console.log("🔍 Enviando filtros a la API:", filtros);

    // B. Pedir datos al servidor (usa la función optimizada de propiedades.js)
    const data = await cargarPropiedades(filtros);
    
    // C. Actualizar contador de resultados
    if (resultadosSpan) {
      const total = data.total !== undefined ? data.total : (data.propiedades ? data.propiedades.length : 0);
      resultadosSpan.textContent = `Resultados: ${total} Propiedades`;
    }

    // D. Renderizar las tarjetas
    if (data.propiedades && data.propiedades.length > 0) {
      gridContainer.innerHTML = data.propiedades.map(prop => crearCardPropiedad(prop)).join('');
    } else {
      // Mensaje de "No se encontraron resultados"
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; color: #e5e7eb; margin-bottom: 20px;"></i>
            <h3 style="color: #374151; font-size: 1.2rem; margin-bottom: 10px;">No encontramos propiedades</h3>
            <p style="color: #6B7280;">Intenta ajustar tus filtros de búsqueda para ver más resultados.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #DC2626;">
        <p>Ocurrió un error al cargar los datos. Por favor intenta de nuevo.</p>
      </div>`;
  }
}

/**
 * Lee los valores de los inputs del HTML y arma el objeto de filtros
 */
function obtenerFiltrosDesdeHTML() {
  // Helper para leer valor por ID de forma segura (si el elemento no existe, devuelve null)
  const val = (id) => {
    const el = document.getElementById(id);
    return el && el.value !== "" ? el.value : null;
  };

  // Construir objeto base
  const params = {
    limit: 50,
    precioMin: val('filtro-precio-min'),
    precioMax: val('filtro-precio-max'),
    habitaciones: val('filtro-habitaciones'),
    banos: val('filtro-banos'),
    operacion: val('filtro-operacion'),
    tipoInmueble: val('filtro-tipo')
  };

  // Lógica especial para el ordenamiento
  const ordenVal = val('filtro-ordenar');
  if (ordenVal === 'precio_canon_asc') {
    params.ordenar = 'precio_canon';
    params.orden = 'ASC';
  } else if (ordenVal === 'precio_canon_desc') {
    params.ordenar = 'precio_canon';
    params.orden = 'DESC';
  } else if (ordenVal) {
    params.ordenar = ordenVal; // ej: 'creado_en' o 'area_m2'
    params.orden = 'DESC';     // por defecto descendente
  }

  return params;
}

/**
 * Crea el HTML de una tarjeta individual
 */
function crearCardPropiedad(prop) {
  // Asegurar datos seguros para evitar errores visuales
  // Prioriza thumbnail, luego imagen original, luego placeholder
  const imagen = prop.thumbnail_url || prop.imagen_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400';
  const precio = prop.precio_canon || '$0';
  const direccion = prop.direccion || 'Ubicación no disponible';
  const habitaciones = prop.habitaciones || 0;
  const banos = prop.banos || 0;
  const area = prop.area_m2 || 0;
  
  // Etiqueta visual de operación
  const esVenta = prop.operacion === 'VENTA';
  const operacionTag = esVenta ? 'Venta' : 'Arriendo';
  const tagColor = esVenta ? 'background-color: #2563EB;' : ''; // Azul para venta, Rojo (por defecto css) para arriendo

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
          <i class="fa-solid fa-location-dot"></i> ${prop.ciudad || 'Buga, Valle'}
        </p>
        <div class="specs-list">
          <span><i class="fa-solid fa-bed"></i> ${habitaciones}</span>
          <span><i class="fa-solid fa-bath"></i> ${banos}</span>
          <span><i class="fa-solid fa-maximize"></i> ${area} m²</span>
        </div>
        
        <div style="margin-top: 15px;">
            <a href="/propiedad.html?id=${prop.id}" class="btn-ver-detalle" 
               style="display: block; text-align: center; background: #f3f4f6; color: #374151; padding: 8px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background 0.2s;">
               Ver Detalle
            </a>
        </div>
      </div>
    </article>
  `;
}