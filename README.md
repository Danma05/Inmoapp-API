# InmoApp API - Backend Completo

Aplicación backend para gestión inmobiliaria con Node.js, Express y PostgreSQL.

## 📋 Estructura del Proyecto

```
Inmoapp-API/
├── database/
│   └── schema.sql          # Script SQL para crear todas las tablas
├── routers/                 # Módulos de rutas organizados
│   ├── auth.js             # Autenticación y registro
│   ├── propiedades.js      # Gestión de propiedades
│   ├── favoritos.js        # Favoritos de usuarios
│   ├── visitas.js          # Visitas programadas
│   ├── postulaciones.js    # Postulaciones de arrendatarios
│   ├── mensajes.js         # Sistema de mensajería
│   ├── usuarios.js         # Perfil de usuario
│   ├── notificaciones.js   # Notificaciones
│   └── passport.js         # Pasaporte del arrendatario
├── public/                  # Frontend estático
├── db.js                    # Configuración de PostgreSQL
├── dbQuery.js               # Helper para queries con reintentos
└── index.js                 # Servidor principal
```

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Base de Datos

**Opción A: Usando pgAdmin (Recomendado para Windows)**

1. Abre pgAdmin y conéctate a tu base de datos de Render
2. Click derecho en tu base de datos → "Query Tool"
3. Abre el archivo `database/EJECUTAR_EN_PGADMIN.sql` o `database/schema.sql`
4. Copia TODO el contenido y pégalo en el Query Tool
5. Ejecuta (F5 o botón Execute ⚡)

**Opción B: Usando Script Node.js**

1. Crea un archivo `.env` en la raíz del proyecto con tu `DATABASE_URL` de Render:

```env
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/nombre_db
PORT=3000
```

2. Ejecuta el script:

```bash
npm run setup-db
```

**Ver instrucciones detalladas en:** `database/INSTRUCCIONES.md`

### 3. Ejecutar el servidor

```bash
# Modo producción
npm start

# Modo desarrollo (con recarga automática)
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Endpoints de la API

### Autenticación
- `POST /login` - Iniciar sesión
- `POST /usuarios` - Registrar nuevo usuario
- `GET /usuarios` - Listar usuarios

### Propiedades
- `GET /propiedades` - Listar propiedades (con filtros)
- `GET /propiedades/:id` - Obtener propiedad por ID
- `GET /propiedades/mis-propiedades?usuarioId=X` - Propiedades del propietario
- `POST /propiedades` - Crear propiedad
- `PUT /propiedades/:id` - Actualizar propiedad
- `DELETE /propiedades/:id` - Eliminar propiedad (soft delete)

### Favoritos
- `GET /favoritos?usuarioId=X` - Listar favoritos
- `POST /favoritos` - Agregar a favoritos
- `DELETE /favoritos/:id?usuarioId=X` - Quitar de favoritos

### Visitas
- `GET /visitas?usuarioId=X&estado=PENDIENTE` - Listar visitas
- `POST /visitas` - Crear visita
- `PUT /visitas/:id` - Confirmar/cancelar visita

### Postulaciones
- `GET /postulaciones?usuarioId=X&estado=APROBADA` - Listar postulaciones
- `POST /postulaciones` - Crear postulación
- `PUT /postulaciones/:id` - Actualizar estado

### Mensajes
- `GET /mensajes/conversaciones?usuarioId=X` - Listar conversaciones
- `GET /mensajes?usuarioId=X&otroUsuarioId=Y` - Mensajes de conversación
- `POST /mensajes` - Enviar mensaje

### Usuarios
- `GET /usuarios/perfil?usuarioId=X` - Obtener perfil
- `PUT /usuarios/perfil` - Actualizar perfil

### Notificaciones
- `GET /notificaciones?usuarioId=X&leida=false` - Listar notificaciones
- `PUT /notificaciones/:id?usuarioId=X` - Marcar como leída
- `PUT /notificaciones/marcar-todas` - Marcar todas como leídas

### Pasaporte
- `POST /passport/init` - Inicializar pasaporte
- `POST /passport/document` - Subir documento

## 🗄️ Base de Datos

### Tablas Principales

- **usuarios** - Usuarios del sistema (Arrendatarios y Propietarios)
- **propiedades** - Propiedades inmobiliarias
- **favoritos** - Propiedades favoritas
- **visitas** - Visitas programadas
- **postulaciones** - Postulaciones de arrendatarios
- **mensajes** - Mensajes entre usuarios
- **notificaciones** - Notificaciones del sistema
- **pasaportes_arrendatario** - Pasaportes de arrendatarios
- **documentos_arrendatario** - Documentos subidos

### Ejecutar el Schema

El archivo `database/schema.sql` incluye:
- ✅ Creación de todas las tablas
- ✅ Índices para mejor rendimiento
- ✅ Triggers para actualizar `actualizado_en` automáticamente
- ✅ Constraints y relaciones (foreign keys)
- ✅ Comentarios en tablas

## 🔧 Variables de Entorno

Crea un archivo `.env` con:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/nombre_db

# Puerto del servidor (opcional, default: 3000)
PORT=3000

# Configuración del pool (opcional)
PG_POOL_MAX=10
PG_IDLE_MS=30000
PG_CONN_MS=10000
```

## 📝 Notas Importantes

1. **Seguridad**: Las contraseñas actualmente se almacenan en texto plano. Para producción, implementa bcrypt.

2. **Autenticación**: Los endpoints actualmente reciben `usuarioId` como parámetro. Considera implementar JWT para producción.

3. **Filtros**: El endpoint `GET /propiedades` soporta múltiples filtros:
   - `tipoInmueble`, `operacion`, `precioMin`, `precioMax`
   - `habitaciones`, `banos`, `areaMin`, `areaMax`
   - `direccion`, `limit`, `offset`, `ordenar`, `orden`

4. **Paginación**: Los endpoints de listado incluyen paginación con `limit` y `offset`.

## 🐛 Troubleshooting

- **Error de conexión a BD**: Verifica que `DATABASE_URL` esté correctamente configurado en `.env`
- **Tablas no existen**: Ejecuta el script `database/schema.sql`
- **Puerto en uso**: Cambia el `PORT` en `.env` o termina el proceso que usa el puerto 3000

## 📦 Dependencias

- `express` ^5.1.0 - Framework web
- `pg` ^8.16.3 - Cliente PostgreSQL
- `nodemon` ^3.1.10 - Recarga automática (dev)

## 🌐 Despliegue

El proyecto está configurado para funcionar en Render. Asegúrate de:
1. Configurar `DATABASE_URL` en las variables de entorno de Render
2. El script SQL ya debe estar ejecutado en tu base de datos
3. El servidor iniciará automáticamente en el puerto asignado por Render

---

**Desarrollado para InmoApp** 🏠

