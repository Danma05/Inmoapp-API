// public/js/propiedades.js - Funciones para cargar y mostrar propiedades

/**
 * Cargar propiedades desde la API
 */
export async function cargarPropiedades(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filtros.tipoInmueble) params.append('tipoInmueble', filtros.tipoInmueble);
    if (filtros.operacion) params.append('operacion', filtros.operacion);
    if (filtros.precioMin) params.append('precioMin', filtros.precioMin);
    if (filtros.precioMax) params.append('precioMax', filtros.precioMax);
    if (filtros.habitaciones) params.append('habitaciones', filtros.habitaciones);
    if (filtros.banos) params.append('banos', filtros.banos);
    if (filtros.areaMin) params.append('areaMin', filtros.areaMin);
    if (filtros.areaMax) params.append('areaMax', filtros.areaMax);
    if (filtros.direccion) params.append('direccion', filtros.direccion);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.offset) params.append('offset', filtros.offset);
    if (filtros.ordenar) params.append('ordenar', filtros.ordenar);
    if (filtros.orden) params.append('orden', filtros.orden);

    const url = `/propiedades${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error cargando propiedades:', error);
    throw error;
  }
}

// =========================
// Favoritos - funciones cliente
// =========================
const FAVORITOS_BASE = '/api/favoritos';

// Enviar usuarioId en header X-Usuario-Id para mayor consistencia
export async function addFavorite(usuarioId, propiedadId) {
  const headers = { 'Content-Type': 'application/json' };
  const token = obtenerToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // legacy header for compatibility if token not present
  if (!token) headers['x-usuario-id'] = String(usuarioId);

  const resp = await fetch(FAVORITOS_BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify({ propiedadId })
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || 'Error agregando favorito');
  }
  // API devuelve { ok: true, favorito: {...} } o { ok: true, message: 'Ya estaba...' }
  return data;
}

export async function removeFavorite(usuarioId, favoritoId) {
  const headers = {};
  const token = obtenerToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!token) headers['x-usuario-id'] = String(usuarioId);

  const resp = await fetch(`${FAVORITOS_BASE}/${favoritoId}`, {
    method: 'DELETE',
    headers
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || 'Error eliminando favorito');
  }
  return data;
}

export async function loadFavorites() {
  const user = obtenerUsuario();
  if (!user) return { favoritos: [] };
  const token = obtenerToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // keep query for compatibility
  const resp = await fetch(`${FAVORITOS_BASE}?usuarioId=${user.id}`, {
    headers: token ? headers : { 'x-usuario-id': String(user.id) }
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'Error cargando favoritos');
  }
  const data = await resp.json();
  // API now returns { ok: true, favoritos: [...] }
  return data;
}

// Inicializar listeners delegados para botones de favorito
export function initFavButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.fav-btn');
    if (!btn) return;

    e.preventDefault();

    const propId = btn.getAttribute('data-propiedad-id');
    if (!propId) return alert('Propiedad inválida');

    const user = obtenerUsuario();
    if (!user) {
      return alert('Debes iniciar sesión para marcar favoritos.');
    }

    // Si ya tiene favoritoId -> eliminar, sino crear
    const favId = btn.getAttribute('data-favorito-id');
    try {
      if (favId) {
        await removeFavorite(user.id, favId);
        btn.removeAttribute('data-favorito-id');
        btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        btn.style.color = '';
      } else {
        const res = await addFavorite(user.id, Number(propId));
        // backend devuelve { ok: true, favorito: {...} } o { ok: true, message: 'Ya...' }
        const favoritoObj = res.favorito || res.favorito || res.favorito || null;
        // Puede venir la fila entera en res.favorito o res.favoritoId; buscar id en varias formas
        const newId = favoritoObj?.id || favoritoObj?.favorito_id || res.favorito?.id || res.favorito?.favorito_id || res.favoritoId || res.id || null;
        if (newId) btn.setAttribute('data-favorito-id', newId);
        btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        btn.style.color = 'var(--brand-red)';
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert(err.message || 'Error en favoritos');
    }
  });
}

// Renderizar grid de favoritos (usado en favoritos.html)
export function renderizarFavoritos(favoritos, contenedorId = 'favorites-grid') {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  if (!favoritos || favoritos.length === 0) {
    contenedor.innerHTML = '<p style="text-align:center; padding:40px; color:#6B7280;">No tienes favoritos aún.</p>';
    return;
  }

  contenedor.innerHTML = favoritos.map(f => {
    const p = f.propiedad || {};
    return `
      <article class="prop-card-list" style="flex-direction: column; height: auto;">
        <div class="card-img-list" style="width: 100%; height: 220px;">
          <input type="checkbox" class="select-check" data-id="${p.id}">
          <img src="${p.imagen_url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400'}" alt="Propiedad">
          <button class="fav-btn" data-propiedad-id="${p.id}" data-favorito-id="${f.favoritoId || ''}" style="color: var(--brand-red);">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>
        <div class="card-info-list" style="padding: 15px;">
          <div class="price-red">${p.precio_canon || '$0'}</div>
          <h3>${p.direccion || 'Dirección no disponible'}</h3>
          <p class="location-list"><i class="fa-solid fa-location-dot"></i> ${p.direccion || ''}</p>
          <div class="specs-list">
            <span><i class="fa-solid fa-bed"></i> ${p.habitaciones || 0}</span>
            <span><i class="fa-solid fa-bath"></i> ${p.banos || 0}</span>
            <span><i class="fa-solid fa-maximize"></i> ${p.area_m2 || 0} m²</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Renderizar propiedades en un contenedor
 */
export function renderizarPropiedades(propiedades, contenedorId, tipoVista = 'grid') {
  const contenedor = document.getElementById(contenedorId) || document.querySelector(`.${contenedorId}`);
  
  if (!contenedor) {
    console.warn(`⚠️ No se encontró el contenedor: ${contenedorId}`);
    return;
  }

  if (!propiedades || propiedades.length === 0) {
    contenedor.innerHTML = '<p style="text-align: center; padding: 40px; color: #6B7280;">No se encontraron propiedades.</p>';
    return;
  }

  if (tipoVista === 'grid') {
    contenedor.innerHTML = propiedades.map(prop => crearCardPropiedad(prop)).join('');
  } else if (tipoVista === 'list') {
    contenedor.innerHTML = propiedades.map(prop => crearCardPropiedadLista(prop)).join('');
  } else if (tipoVista === 'row') {
    contenedor.innerHTML = propiedades.map(prop => crearCardPropiedadFila(prop)).join('');
  }
}

/**
 * Crear card de propiedad para grid
 */
function crearCardPropiedad(prop) {
  const imagen = prop.imagen_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800';
  const precio = prop.precio_canon || '$0';
  const direccion = prop.direccion || 'Dirección no disponible';
  const habitaciones = prop.habitaciones || 0;
  const banos = prop.banos || 0;
  const area = prop.area_m2 || 0;

  return `
    <article class="prop-card-list">
      <div class="card-img-list">
        <span class="new-tag">Nuevo!</span>
        <img src="${imagen}" alt="${direccion}" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400'">
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

/**
 * Crear card de propiedad para lista
 */
function crearCardPropiedadLista(prop) {
  const imagen = prop.imagen_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800';
  const precio = prop.precio_canon || '$0';
  const direccion = prop.direccion || 'Dirección no disponible';
  const habitaciones = prop.habitaciones || 0;
  const banos = prop.banos || 0;
  const area = prop.area_m2 || 0;

  return `
    <article class="prop-card-list">
      <div class="card-img-list">
        <img src="${imagen}" alt="${direccion}" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400'">
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

/**
 * Crear card de propiedad para fila (dashboard propietario)
 */
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

/**
 * Cargar mis propiedades (para propietario)
 */
export async function cargarMisPropiedades(usuarioId) {
  try {
    const token = obtenerToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`/propiedades/mis-propiedades`, { headers });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const propiedades = await response.json();
    return propiedades;
  } catch (error) {
    console.error('❌ Error cargando mis propiedades:', error);
    throw error;
  }
}

/**
 * Obtener usuario del localStorage
 */
export function obtenerUsuario() {
  const userStr = localStorage.getItem('inmoapp_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parseando usuario:', e);
    return null;
  }
}

/** Obtener token JWT guardado en localStorage */
export function obtenerToken() {
  try {
    return localStorage.getItem('inmoapp_token') || null;
  } catch (e) {
    return null;
  }
}

