@echo off
echo 🚀 Iniciando Mango Rastreo Chain Development Environment...

REM 1. Iniciar Supabase
echo 📦 Iniciando Supabase...
npx supabase start

REM 2. Aplicar migraciones
echo 🔄 Aplicando migraciones...
npx supabase db push

REM 3. Cargar seed data
echo 🌱 Cargando seed data...
psql -h localhost -U postgres -d postgres -f supabase\seed_realistic_scenarios.sql

REM 4. Crear cuenta demo (si existe)
echo 👤 Creando cuenta demo...
psql -h localhost -U postgres -d postgres -f supabase\create_demo_account.sql

REM 5. Iniciar aplicación
echo 🎯 Iniciando aplicación...
echo 📍 Login: http://localhost:5173/login
echo 📍 Dashboard: http://localhost:5173/overview
echo 📍 Consignments: http://localhost:5173/consignments
echo.
echo 📋 Cuenta Demo:
echo    Email: demo@mangorastreo.com
echo    Rol: compliance_lead
echo.
echo ⚠️  IMPORTANTE: Configurar Google OAuth antes de usar login con Google
echo    Ver docs/GOOGLE_OAUTH_QUICK_SETUP.md
echo.
npm run dev

pause
