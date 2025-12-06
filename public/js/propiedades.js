// public/js/propiedades.js

// Definimos la URL base por si se necesita (aunque tus funciones actuales usan rutas relativas)
const API_URL = 'https://inmoapp-api.onrender.com';

/**
 * Cargar propiedades desde la API (Pública - Listado General)
 * Convierte automáticamente cualquier filtro que reciba en parámetros URL
 */
export async function cargarPropiedades(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    // Bucle dinámico: Recorre todas las llaves del objeto filtros
    Object.keys(filtros).forEach(key => {
      const valor = filtros[key];
      // Solo agrega el parámetro si tiene un valor real (no null, no undefined, no vacío)
      if (valor !== null && valor !== undefined && valor !== '') {
        params.append(key, valor);
      }
    });

    // Construir URL final
    const queryString = params.toString();
    const url = `/propiedades${queryString ? '?' + queryString : ''}`;
    
    // console.log(`📡 Consultando API: ${url}`); 

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error cargando propiedades:', error);
    // Retornamos estructura vacía para evitar romper el frontend si falla la API
    return { propiedades: [], total: 0 };
  }
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
    contenedor.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6B7280;">
        <i class="fa-regular fa-folder-open" style="font-size: 2em; margin-bottom: 10px;"></i>
        <p>No se encontraron propiedades con estos filtros.</p>
      </div>`;
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
 * Crear card de propiedad para GRID (Vista principal)
 */
function crearCardPropiedad(prop) {
  // Fallback de imagen seguro
  const imagen = prop.thumbnail_url || prop.imagen_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800';
  const precio = prop.precio_canon || '$0';
  const direccion = prop.direccion || 'Dirección no disponible';
  const habitaciones = prop.habitaciones || 0;
  const banos = prop.banos || 0;
  const area = prop.area_m2 || 0;
  
  // Etiqueta de Venta o Arriendo
  const operacionTag = prop.operacion === 'VENTA' ? 'Venta' : 'Arriendo';
  const tagColorClass = prop.operacion === 'VENTA' ? 'bg-blue-600' : 'new-tag'; 
  const tagStyle = prop.operacion === 'VENTA' ? 'background-color:#2563EB;' : '';

  return `
    <article class="prop-card-list">
      <div class="card-img-list">
        <span class="${tagColorClass}" style="${tagStyle}">${operacionTag}</span>
        <img src="${imagen}" alt="${direccion}" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400'">
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
        <div style="margin-top: 15px; text-align: center;">
            <a href="/propiedades-detalles?id=${prop.id}" class="btn-ver-detalle" style="display:inline-block; width:100%; padding: 8px; background: #f3f4f6; color: #374151; border-radius: 6px; text-decoration: none; font-size: 0.9rem; font-weight: 500;">Ver Detalle</a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Crear card de propiedad para LISTA (Dashboard)
 */
function crearCardPropiedadLista(prop) {
  return crearCardPropiedad(prop); // Reutilizamos el diseño de grid por ahora
}

/**
 * Crear card de propiedad para FILA (Tabla/Dashboard Propietario)
 */
function crearCardPropiedadFila(prop) {
  const imagen = prop.thumbnail_url || prop.imagen_url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200';
  const estado = prop.estado_publicacion === 'PUBLICADO' ? 'published' : 'review';
  const estadoTexto = prop.estado_publicacion === 'PUBLICADO' ? 'Publicado' : 'En Revisión';
  const badgeClass = prop.estado_publicacion === 'PUBLICADO' ? 'status-badge published' : 'status-badge review';

  return `
    <div class="property-row-card">
      <img src="${imagen}" class="row-img" alt="${prop.direccion}" onerror="this.src='https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200'">
      <div class="row-info">
        <div class="row-header">
          <h3>${prop.direccion}</h3>
          <span class="${badgeClass}">${estadoTexto}</span>
        </div>
        <p class="row-address">
          <i class="fa-solid fa-location-dot"></i> ${prop.direccion}
        </p>
        <div class="row-stats">
          <span><i class="fa-solid fa-bed"></i> ${prop.habitaciones} Hab</span>
          <span><i class="fa-solid fa-ruler"></i> ${prop.area_m2} m²</span>
          <span class="price">${prop.precio_canon}</span>
        </div>
      </div>
      <div class="row-actions">
        <button class="btn-icon" title="Editar" onclick="alert('Editar propiedad ${prop.id}')">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn-icon delete btn-delete-prop" data-id="${prop.id}" title="Eliminar">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Cargar MIS propiedades (Privada - Requiere Token)
 * ✅ Esta función incluye la autorización JWT necesaria para el backend.
 */
export async function cargarMisPropiedades(usuarioId) {
  try {
    // 1. Obtener el token guardado en el login
    const token = localStorage.getItem('inmoapp_token');
    
    // 2. Preparar encabezados
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // 3. Si hay token, agregarlo como Bearer
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 4. Hacer la petición CON los headers
    // Nota: Usamos API_URL si estás usando CORS, o ruta relativa si tienes proxy
    // Para asegurar compatibilidad con tu código actual, uso ruta relativa:
    const response = await fetch(`/propiedades/mis-propiedades?usuarioId=${usuarioId}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Sesión expirada o inválida.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const propiedades = await response.json();
    return propiedades;

  } catch (error) {
    console.error('❌ Error cargando mis propiedades:', error);
    return [];
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

/**
 * ✅ NUEVA FUNCIÓN: Crear una propiedad (POST)
 * Esta es la función que te faltaba y causaba el error de SyntaxError.
 */
export async function crearPropiedad(datosPropiedad) {
    try {
        const token = localStorage.getItem('inmoapp_token');
        
        const headers = {
            'Content-Type': 'application/json'
        };

        // Agregar autenticación
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Realizar la petición POST
        // Usamos la API_URL absoluta para asegurar que llegue al backend correcto
        const response = await fetch(`${API_URL}/propiedades`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(datosPropiedad)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear la propiedad');
        }

        const data = await response.json();
        return true; // Retornamos éxito

    } catch (error) {
        console.error("❌ Error en crearPropiedad:", error);
        alert(`Error al publicar: ${error.message}`);
        return false;
    }
}