// public/js/explorar.js - Script para la página de explorar propiedades
import { cargarPropiedades } from './propiedades.js';

let usuarioActual = null;
let favoritosActuales = []; // Lista de IDs de propiedades favoritas del usuario

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Página Explorar iniciada');

  // 1. Obtener Usuario y cargar favoritos iniciales
  const userStr = localStorage.getItem('inmoapp_user');
  if (userStr) {
    usuarioActual = JSON.parse(userStr);
    await cargarFavoritosIniciales();
  }

  // 2. Ejecutar búsqueda inicial (con filtros vacíos)
  await ejecutarBusqueda();

  // 3. Configurar listeners para filtros, ordenamiento Y el corazón
  configurarListenersFiltros();
});


async function cargarFavoritosIniciales() {
    try {
        // Usamos la ruta API segura que configuramos previamente
        const res = await fetch(`/api/favoritos?usuarioId=${usuarioActual.id}`);
        const data = await res.json();
        
        // Guardamos solo los IDs para una búsqueda rápida
        // Aseguramos que propiedad_id sea string para coincidir con prop.id.toString()
        favoritosActuales = data.favoritos.map(fav => fav.propiedad_id.toString());
        console.log(`❤️ Cargados ${favoritosActuales.length} favoritos iniciales.`);
    } catch (e) {
        console.error("Error cargando lista de favoritos:", e);
    }
}

function configurarListenersFiltros() {
    const btnAplicar = document.getElementById('btn-aplicar-filtros');
    if (btnAplicar) {
        btnAplicar.addEventListener('click', (e) => {
            e.preventDefault();
            ejecutarBusqueda();
        });
    }

    const selectOrden = document.getElementById('filtro-ordenar');
    if (selectOrden) {
        selectOrden.addEventListener('change', () => ejecutarBusqueda());
    }

    // LISTENER PARA LOS BOTONES DE CORAZÓN
    document.addEventListener('click', (e) => {
        const heartButton = e.target.closest('.fav-btn');
        if (heartButton) {
            const propiedadId = heartButton.dataset.propiedadId;
            if (propiedadId && usuarioActual) {
                toggleFavorito(propiedadId, heartButton);
            } else if (!usuarioActual) {
                 alert("Debes iniciar sesión para agregar favoritos.");
            }
        }
    });
}

/**
 * Función central que lee los filtros, llama a la API y pinta la grilla
 */
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
      // Pasamos la lista de favoritos al crear las tarjetas
      gridContainer.innerHTML = data.propiedades.map(prop => crearCardPropiedad(prop, favoritosActuales)).join('');
    } else {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; color: #e5e7eb; margin-bottom: 20px;"></i>
            <h3 style="color: #374151; font-size: 1.2rem;">No encontramos propiedades</h3>
            <p style="color: #6B7280;">Intenta ajustar tus filtros de búsqueda.</p>
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

function crearCardPropiedad(prop, favoritosList) {
  // Verificamos si la propiedad está en la lista de favoritos del usuario
  // Convertimos a string para asegurar comparación correcta
  const isFavorite = favoritosList.includes(prop.id.toString()); 
  
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
        
        <button class="fav-btn" data-propiedad-id="${prop.id}" style="${isFavorite ? 'color: var(--brand-red);' : ''}">
          <i class="${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>

      </div>
      <div class="card-info-list">
        <div class="price-red">${precio}</div>
        <h3>${direccion}</h3>
        <p class="location-list">
          <i class="fa-solid fa-location-dot"></i> ${prop.ciudad || direccion}
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

// ============================================
// FUNCIÓN CORREGIDA
// ============================================
async function toggleFavorito(propiedadId, buttonElement) {
    // 1. Seleccionamos el icono 'i' directamente para evitar el error de null
    const icon = buttonElement.querySelector('i'); 
    
    // 2. Verificamos si es favorito mirando si tiene la clase 'fa-solid'
    // Esto evita buscar un elemento que podría no existir
    const isCurrentlyFavorite = icon.classList.contains('fa-solid');
    
    // Si ya es favorito, eliminamos. Si no, agregamos.
    // Importante: Agregada la barra '/' antes del ID para DELETE
    const url = `/api/favoritos${isCurrentlyFavorite ? '/' + propiedadId : ''}?usuarioId=${usuarioActual.id}`;
    
    // 3. Actualización Optimista de la UI (Cambio visual inmediato)
    buttonElement.style.color = isCurrentlyFavorite ? '' : 'var(--brand-red)';
    icon.classList.toggle('fa-solid'); 
    icon.classList.toggle('fa-regular');

    try {
        const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
        const bodyData = isCurrentlyFavorite ? {} : { usuarioId: usuarioActual.id, propiedadId: propiedadId };

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'POST' ? JSON.stringify(bodyData) : null
        });

        if (!res.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        // 4. Actualizar la lista global de favoritos en memoria
        if (isCurrentlyFavorite) {
            // Lo quitamos de la lista
            favoritosActuales = favoritosActuales.filter(id => id !== propiedadId.toString());
        } else {
            // Lo agregamos a la lista
            favoritosActuales.push(propiedadId.toString());
        }

    } catch (e) {
        console.error(e);
        alert("Error de conexión al servidor. Se revertirá el cambio.");
        
        // REVERTIR UI en caso de error (Volver al estado anterior)
        buttonElement.style.color = isCurrentlyFavorite ? 'var(--brand-red)' : '';
        icon.classList.toggle('fa-solid');
        icon.classList.toggle('fa-regular');
    }
}