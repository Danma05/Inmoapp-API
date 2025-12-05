# 📋 Instrucciones para Ejecutar el Schema SQL

## Opción 1: Usando pgAdmin (Recomendado para Windows)

1. **Abre pgAdmin** (deberías tenerlo instalado)

2. **Conéctate a tu base de datos de Render:**
   - Click derecho en "Servers" → "Create" → "Server"
   - En la pestaña "General": Nombre: `Render-InmoApp`
   - En la pestaña "Connection":
     - Host: (tu host de Render, ej: `dpg-xxxxx-a.oregon-postgres.render.com`)
     - Port: `5432`
     - Database: `Render-InmoApp` (o el nombre de tu BD)
     - Username: (tu usuario de Render)
     - Password: (tu contraseña de Render)
     - Marca "Save password"

3. **Ejecutar el script:**
   - Click derecho en tu base de datos → "Query Tool"
   - Abre el archivo `database/schema.sql`
   - Copia TODO el contenido
   - Pégalo en el Query Tool
   - Click en "Execute" (⚡) o presiona F5

## Opción 2: Usando el Script Node.js (Requiere .env local)

Si quieres usar el script automático, necesitas crear un archivo `.env` local:

1. **Crea un archivo `.env` en la raíz del proyecto:**

```env
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/nombre_db
```

2. **Obtén la URL de conexión de Render:**
   - Ve a tu dashboard de Render
   - Selecciona tu base de datos PostgreSQL
   - Ve a "Connections" → "Internal Database URL" o "External Database URL"
   - Copia la URL completa

3. **Ejecuta el script:**

```bash
npm run setup-db
```

## Opción 3: Desde la Terminal de Render (Si tienes acceso SSH)

Si Render te da acceso SSH a tu base de datos:

```bash
# Conectarte a la base de datos
psql $DATABASE_URL

# Dentro de psql, ejecutar:
\i database/schema.sql
```

O copiar y pegar el contenido del archivo directamente.

## ⚠️ Nota Importante

Si ya tienes algunas tablas creadas (como `usuarios` y `propiedades`), el script usará `CREATE TABLE IF NOT EXISTS`, así que no habrá problemas. Solo creará las tablas que faltan.

## ✅ Verificar que Funcionó

Después de ejecutar el script, puedes verificar que las tablas se crearon:

```sql
-- En pgAdmin Query Tool, ejecuta:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver estas tablas:
- documentos_arrendatario
- favoritos
- mensajes
- notificaciones
- pasaportes_arrendatario
- postulaciones
- propiedades
- usuarios
- visitas

### Añadir la tabla de auditoría (opcional)

Si quieres habilitar el registro de auditoría para acciones administrativas (como la publicación masiva que implementamos), ejecuta el archivo de migración que añadimos:

1. Abre `database/001-create-admin-auditoria.sql` y ejecuta su contenido en tu Query Tool (pgAdmin) o mediante `psql`.

2. Verifica la creación con:

```sql
SELECT * FROM public.admin_auditoria LIMIT 10;
```

La tabla tiene la estructura: `id, admin_id, propiedad_ids (JSON text), cantidad, creado_en`.

