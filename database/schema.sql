-- ============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS INMOAPP
-- ============================================

-- Tabla de Usuarios (ya debería existir, pero la incluimos por si acaso)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(50) NOT NULL DEFAULT 'ARRENDATARIO', -- ARRENDATARIO | PROPIETARIO
    password_hash VARCHAR(255) NOT NULL,
    acepta_terminos BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Propiedades (ya debería existir, pero la incluimos por si acaso)
CREATE TABLE IF NOT EXISTS public.propiedades (
    id SERIAL PRIMARY KEY,
    propietario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_inmueble VARCHAR(50) DEFAULT 'APARTAMENTO', -- APARTAMENTO | CASA | OFICINA | LOCAL
    operacion VARCHAR(50) DEFAULT 'ARRIENDO', -- ARRIENDO | VENTA
    direccion TEXT NOT NULL,
    habitaciones INTEGER DEFAULT 0,
    banos INTEGER DEFAULT 0,
    area_m2 DECIMAL(10, 2) DEFAULT 0,
    descripcion TEXT,
    precio_canon VARCHAR(50) NOT NULL, -- Almacenado como string para formato "$850.000"
    imagen_url TEXT,
    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pasaportes de Arrendatario (ya debería existir)
CREATE TABLE IF NOT EXISTS public.pasaportes_arrendatario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tiene_doc_identidad BOOLEAN DEFAULT FALSE,
    tiene_solvencia BOOLEAN DEFAULT FALSE,
    tiene_ingresos BOOLEAN DEFAULT FALSE,
    tiene_otros BOOLEAN DEFAULT FALSE,
    progreso_porcentaje INTEGER DEFAULT 0,
    completado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Documentos de Arrendatario (ya debería existir)
CREATE TABLE IF NOT EXISTS public.documentos_arrendatario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL, -- IDENTIDAD | SOLVENCIA | INGRESOS | OTROS
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    mime_type VARCHAR(100),
    tamano_bytes BIGINT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLAS NUEVAS
-- ============================================

-- Tabla de Favoritos
CREATE TABLE IF NOT EXISTS public.favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    propiedad_id INTEGER NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, propiedad_id) -- Evita duplicados
);

-- Tabla de Visitas
CREATE TABLE IF NOT EXISTS public.visitas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    propiedad_id INTEGER NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    fecha_visita DATE NOT NULL,
    hora_visita TIME NOT NULL,
    estado VARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE | CONFIRMADA | CANCELADA | COMPLETADA
    notas TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Postulaciones
CREATE TABLE IF NOT EXISTS public.postulaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    propiedad_id INTEGER NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    mensaje TEXT,
    estado VARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE | EN_REVISION | APROBADA | RECHAZADA
    mensaje_respuesta TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, propiedad_id) -- Un usuario solo puede postular una vez por propiedad
);

-- Tabla de Mensajes
CREATE TABLE IF NOT EXISTS public.mensajes (
    id SERIAL PRIMARY KEY,
    remitente_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    destinatario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    propiedad_id INTEGER REFERENCES public.propiedades(id) ON DELETE SET NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO', -- INFO | SUCCESS | WARNING | ERROR
    leida BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON public.usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);

-- Índices para propiedades
CREATE INDEX IF NOT EXISTS idx_propiedades_propietario ON public.propiedades(propietario_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_tipo ON public.propiedades(tipo_inmueble);
CREATE INDEX IF NOT EXISTS idx_propiedades_operacion ON public.propiedades(operacion);
CREATE INDEX IF NOT EXISTS idx_propiedades_activa ON public.propiedades(activa);

-- Índices para favoritos
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON public.favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_propiedad ON public.favoritos(propiedad_id);

-- Índices para visitas
CREATE INDEX IF NOT EXISTS idx_visitas_usuario ON public.visitas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_visitas_propiedad ON public.visitas(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_visitas_estado ON public.visitas(estado);
CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON public.visitas(fecha_visita);

-- Índices para postulaciones
CREATE INDEX IF NOT EXISTS idx_postulaciones_usuario ON public.postulaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_propiedad ON public.postulaciones(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_estado ON public.postulaciones(estado);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_mensajes_remitente ON public.mensajes(remitente_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_destinatario ON public.mensajes(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_propiedad ON public.mensajes(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_leido ON public.mensajes(leido);

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON public.notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON public.notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_creado ON public.notificaciones(creado_en);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar actualizado_en
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_propiedades_updated_at BEFORE UPDATE ON public.propiedades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitas_updated_at BEFORE UPDATE ON public.visitas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_postulaciones_updated_at BEFORE UPDATE ON public.postulaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notificaciones_updated_at BEFORE UPDATE ON public.notificaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE public.usuarios IS 'Usuarios del sistema (Arrendatarios y Propietarios)';
COMMENT ON TABLE public.propiedades IS 'Propiedades inmobiliarias publicadas';
COMMENT ON TABLE public.favoritos IS 'Propiedades marcadas como favoritas por los usuarios';
COMMENT ON TABLE public.visitas IS 'Visitas programadas a propiedades';
COMMENT ON TABLE public.postulaciones IS 'Postulaciones de arrendatarios a propiedades';
COMMENT ON TABLE public.mensajes IS 'Mensajes entre usuarios';
COMMENT ON TABLE public.notificaciones IS 'Notificaciones del sistema para usuarios';

