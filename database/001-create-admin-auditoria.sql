-- 001-create-admin-auditoria.sql
-- Migración: crea la tabla admin_auditoria para registrar acciones administrativas en lote

CREATE TABLE IF NOT EXISTS public.admin_auditoria (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  propiedad_ids TEXT NOT NULL, -- guardamos el array JSON como texto
  cantidad INTEGER NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas por admin
CREATE INDEX IF NOT EXISTS idx_admin_auditoria_admin_id ON public.admin_auditoria (admin_id);
