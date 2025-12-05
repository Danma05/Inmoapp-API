-- 002-add-thumbnail-column.sql
-- Agrega columna thumbnail_url a la tabla propiedades

ALTER TABLE IF EXISTS public.propiedades
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
