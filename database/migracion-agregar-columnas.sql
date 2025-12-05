-- ============================================
-- MIGRACIÓN: Agregar columnas faltantes
-- ============================================
-- Este script agrega las columnas que faltan en las tablas existentes
-- Ejecuta esto en pgAdmin Query Tool
-- ============================================

-- Agregar columna "activa" a propiedades si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'propiedades' 
        AND column_name = 'activa'
    ) THEN
        ALTER TABLE public.propiedades ADD COLUMN activa BOOLEAN DEFAULT TRUE;
        UPDATE public.propiedades SET activa = TRUE WHERE activa IS NULL;
        RAISE NOTICE 'Columna "activa" agregada a propiedades';
    ELSE
        RAISE NOTICE 'Columna "activa" ya existe en propiedades';
    END IF;
END $$;

-- Agregar columna "actualizado_en" a propiedades si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'propiedades' 
        AND column_name = 'actualizado_en'
    ) THEN
        ALTER TABLE public.propiedades ADD COLUMN actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Columna "actualizado_en" agregada a propiedades';
    ELSE
        RAISE NOTICE 'Columna "actualizado_en" ya existe en propiedades';
    END IF;
END $$;

-- Agregar columna "actualizado_en" a usuarios si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'actualizado_en'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Columna "actualizado_en" agregada a usuarios';
    ELSE
        RAISE NOTICE 'Columna "actualizado_en" ya existe en usuarios';
    END IF;
END $$;

-- Verificar y crear tablas nuevas (solo las que faltan)
CREATE TABLE IF NOT EXISTS public.favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    propiedad_id INTEGER NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, propiedad_id)
);

CREATE TABLE IF NOT EXISTS public.visitas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    propiedad_id INTEGER NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    fecha_visita DATE NOT NULL,
    hora_visita TIME NOT NULL,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    notas TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.postulaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    propiedad_id INTEGER NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    mensaje TEXT,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    mensaje_respuesta TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, propiedad_id)
);

CREATE TABLE IF NOT EXISTS public.mensajes (
    id SERIAL PRIMARY KEY,
    remitente_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    destinatario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    propiedad_id INTEGER REFERENCES public.propiedades(id) ON DELETE SET NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO',
    leida BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices (si no existen)
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON public.favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_propiedad ON public.favoritos(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_visitas_usuario ON public.visitas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_visitas_propiedad ON public.visitas(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_visitas_estado ON public.visitas(estado);
CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON public.visitas(fecha_visita);
CREATE INDEX IF NOT EXISTS idx_postulaciones_usuario ON public.postulaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_propiedad ON public.postulaciones(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_estado ON public.postulaciones(estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_remitente ON public.mensajes(remitente_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_destinatario ON public.mensajes(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_propiedad ON public.mensajes(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_leido ON public.mensajes(leido);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON public.notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON public.notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_creado ON public.notificaciones(creado_en);

-- Crear función para triggers (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers (eliminar si existen y recrear)
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_propiedades_updated_at ON public.propiedades;
CREATE TRIGGER update_propiedades_updated_at BEFORE UPDATE ON public.propiedades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visitas_updated_at ON public.visitas;
CREATE TRIGGER update_visitas_updated_at BEFORE UPDATE ON public.visitas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_postulaciones_updated_at ON public.postulaciones;
CREATE TRIGGER update_postulaciones_updated_at BEFORE UPDATE ON public.postulaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notificaciones_updated_at ON public.notificaciones;
CREATE TRIGGER update_notificaciones_updated_at BEFORE UPDATE ON public.notificaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mensaje final
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migración completada! Todas las columnas y tablas están listas.';
END $$;

