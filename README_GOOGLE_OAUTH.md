# 🚀 Google OAuth Setup - Mango Rastreo Chain

## Setup Rápido (5 minutos)

### 1. Iniciar Todo
```bash
# Windows
scripts\start-dev.bat

# Mac/Linux
./scripts/start-dev.sh
```

### 2. Configurar Google OAuth
1. Ir a https://console.cloud.google.com/
2. **APIs & Services** > **Credentials**
3. **Create Credentials** > **OAuth client ID**
4. Application type: **Web application**
5. Authorized JavaScript origins: `http://localhost:5173`
6. Authorized redirect URIs: `http://localhost:5173/auth/callback`
7. Guardar Client ID y Client Secret

### 3. Configurar Supabase
1. Ir a https://app.supabase.com/project/nbfyfrpilusttfypglul/auth/providers
2. Activar **Google**
3. Client ID: (copiar de Google Cloud)
4. Client Secret: (copiar de Google Cloud)
5. Guardar

### 4. Probar Login
1. Navegar a `http://localhost:5173/login`
2. Hacer clic en **"Continuar con Google"**
3. Iniciar sesión con `demo@mangorastreo.com`
4. Debería redirigir a `/consignments`

## 📋 Cuenta Demo

- **Email**: `demo@mangorastreo.com`
- **Rol**: `compliance_lead`
- **Permisos**: 
  - ✅ Crear consignaciones
  - ✅ Subir evidencia
  - ✅ Solicitar attestations
  - ✅ Resolver excepciones
  - ✅ Generar packs
  - ✅ Ver audit trail

## 🎯 URLs Importantes

- **Login**: `http://localhost:5173/login`
- **Dashboard**: `http://localhost:5173/overview`
- **Consignments**: `http://localhost:5173/consignments`
- **Auth Callback**: `http://localhost:5173/auth/callback`

## 🔧 Si Algo No Funciona

### Error: "redirect_uri_mismatch"
- Añadir `http://localhost:5173/auth/callback` a Google Cloud Console

### Error: "Invalid provider configuration"
- Activar Google provider en Supabase Dashboard

### Error: "User not found in database"
- Ejecutar: `psql -h localhost -U postgres -d postgres -f supabase/create_demo_account.sql`

### Error: "Table user_roles does not exist"
- Ejecutar: `npx supabase db push`

## 📚 Documentación Completa

- `docs/GOOGLE_OAUTH_QUICK_SETUP.md` - Guía detallada
- `docs/GOOGLE_OAUTH_SETUP.md` - Documentación completa
- `docs/P1_COMPLETE_SUMMARY.md` - Resumen de implementación

## 🎉 ¡Listo!

Una vez configurado, tendrás acceso completo a:
- 4 escenarios de consignaciones preconfiguradas
- Sistema de roles basado en permisos
- Audit trail completo
- Google OAuth funcional
- UI institucional profesional

¡Disfruta del sistema! 🥭
