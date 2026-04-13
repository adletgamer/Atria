-- ============================================================================
-- CREATE DEMO ACCOUNT
-- ============================================================================
-- Este script crea una cuenta demo con rol compliance_lead
-- Ejecutar después de que el usuario se registre con Google OAuth
-- ============================================================================

-- Paso 1: Encontrar el usuario por email
-- SELECT id, email FROM auth.users WHERE email = 'demo@mangorastreo.com';

-- Paso 2: Asignar rol al usuario (reemplazar USER_ID con el ID real)
-- INSERT INTO user_roles (user_id, role, organization_id, created_by)
-- VALUES (
--   'USER_ID_AQUI',
--   'compliance_lead',
--   '00000000-0000-0000-0000-000000000001',
--   'system'
-- );

-- ============================================================================
-- VERSIÓN AUTOMÁTICA (si el usuario ya existe)
-- ============================================================================

DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Buscar usuario demo
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'demo@mangorastreo.com' 
    LIMIT 1;
    
    -- Si existe, asignar rol
    IF demo_user_id IS NOT NULL THEN
        -- Eliminar roles existentes si hay alguno
        DELETE FROM user_roles WHERE user_id = demo_user_id;
        
        -- Insertar nuevo rol
        INSERT INTO user_roles (user_id, role, organization_id, created_by)
        VALUES (
            demo_user_id,
            'compliance_lead',
            '00000000-0000-0000-0000-000000000001',
            'system'
        );
        
        RAISE NOTICE 'Demo account created/updated for user: %', demo_user_id;
    ELSE
        RAISE NOTICE 'Demo user not found. Please register demo@mangorastreo.com first.';
    END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar cuenta demo
SELECT 
    u.id,
    u.email,
    u.created_at,
    ur.role,
    o.name as organization_name,
    ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN organizations o ON ur.organization_id = o.id
WHERE u.email = 'demo@mangorastreo.com';

-- ============================================================================
-- PERMISOS VERIFICATION
-- ============================================================================

-- Verificar que compliance_lead tiene los permisos correctos
SELECT 
    'compliance_lead' as role,
    'canCreateConsignment' as permission,
    true as granted
UNION ALL
SELECT 'compliance_lead', 'canUploadEvidence', true
UNION ALL
SELECT 'compliance_lead', 'canRequestAttestation', true
UNION ALL
SELECT 'compliance_lead', 'canResolveException', true
UNION ALL
SELECT 'compliance_lead', 'canGeneratePack', true
UNION ALL
SELECT 'compliance_lead', 'canAnchorPack', true
UNION ALL
SELECT 'compliance_lead', 'canDeleteConsignment', false
UNION ALL
SELECT 'compliance_lead', 'canViewAuditTrail', true
UNION ALL
SELECT 'compliance_lead', 'canManageUsers', false;

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================

/*
PASOS PARA USAR:

1. Iniciar Supabase:
   npx supabase start

2. Aplicar migraciones:
   npx supabase db push

3. Cargar seed data:
   psql -h localhost -U postgres -d postgres -f supabase/seed_realistic_scenarios.sql

4. Configurar Google OAuth:
   - Ir a Google Cloud Console
   - Crear OAuth credentials
   - Configurar en Supabase Dashboard

5. Registrar usuario demo:
   - Ir a http://localhost:5173/login
   - Hacer clic en "Continuar con Google"
   - Iniciar sesión con demo@mangorastreo.com

6. Asignar rol:
   - Copiar el user_id del resultado anterior
   - Ejecutar el INSERT manualmente o este script completo

7. Verificar:
   SELECT * FROM user_roles WHERE user_id = 'USER_ID_COPIADO';

8. Probar login:
   - Cerrar sesión
   - Iniciar sesión nuevamente
   - Debería redirigir a /consignments
*/
