-- ============================================
-- SCRIPT DE VERIFICACIÓN
-- Ejecuta esto para verificar que todas las tablas están creadas
-- ============================================

-- Ver todas las tablas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar columnas específicas de propiedades
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'propiedades'
ORDER BY ordinal_position;

-- Verificar que las tablas nuevas tienen las columnas correctas
SELECT 
    'favoritos' as tabla,
    COUNT(*) as columnas
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'favoritos'
UNION ALL
SELECT 
    'visitas',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'visitas'
UNION ALL
SELECT 
    'postulaciones',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'postulaciones'
UNION ALL
SELECT 
    'mensajes',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'mensajes'
UNION ALL
SELECT 
    'notificaciones',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notificaciones';

-- Verificar índices creados
SELECT 
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('favoritos', 'visitas', 'postulaciones', 'mensajes', 'notificaciones')
ORDER BY tablename, indexname;

-- Verificar triggers
SELECT 
    trigger_name,
    event_object_table as tabla,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('usuarios', 'propiedades', 'visitas', 'postulaciones', 'notificaciones')
ORDER BY event_object_table, trigger_name;

