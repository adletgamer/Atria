# ✅ CHECKLIST DE VERIFICACIÓN

## 📋 Pre-Requisitos (Verificar)

- [x] Proyecto MangoChain configurado
- [x] Supabase proyecto creado
- [x] MetaMask conectado
- [x] Node.js instalado
- [x] npm/bun funcionando

---

## 🔧 Cambios Implementados (Verificar)

### 1. Archivos Modificados
- [x] `.env` - Variables Supabase + QR añadidas
- [x] `src/components/QRGenerator.tsx` - Mejorado con 150+ líneas
- [x] `src/pages/Registrar.tsx` - Integración con BD

### 2. Archivos Creados
- [x] `src/services/batchService.ts` - Servicio de BD
- [x] `supabase/migrations/create_batch_tables.sql` - Script SQL
- [x] `SUPABASE_SETUP.md` - Documentación Supabase
- [x] `QR_IMPROVEMENTS.md` - Documentación QR
- [x] `IMPLEMENTATION_COMPLETE.md` - Resumen completo
- [x] `QUICK_START.md` - Guía rápida
- [x] `EXAMPLES.md` - Ejemplos de código

---

## 🗄️ Configuración de Supabase (TODO)

### Paso 1: Acceder a Supabase
- [ ] Abre https://app.supabase.com
- [ ] Inicia sesión
- [ ] Selecciona proyecto `nbfyfrpilusttfypglul`

### Paso 2: Crear Tablas
- [ ] Ve a SQL Editor
- [ ] Copia contenido de `supabase/migrations/create_batch_tables.sql`
- [ ] Pega en el editor
- [ ] Haz clic en "Run"
- [ ] Verifica que no haya errores

### Paso 3: Verificar Tablas
- [ ] Ve a Table Editor (menú izquierdo)
- [ ] Verifica tabla `batches` existe
- [ ] Verifica tabla `batch_audit_log` existe
- [ ] Verifica tabla `qr_verifications` existe

### Paso 4: Verificar RLS (Seguridad)
- [ ] Ve a Authentication > Policies
- [ ] Verifica que `batches` tenga RLS habilitado
- [ ] Verifica políticas de lectura/escritura

---

## 🧪 Testing Local (TODO)

### Test 1: Conexión a Supabase
```bash
# Abre la consola del navegador (F12)
# En la consola JavaScript, escribe:

import { testSupabaseConnection } from "@/services/batchService";
await testSupabaseConnection();

# Deberías ver:
# { connected: true, message: "Conectado a Supabase correctamente" }
```
- [ ] Conexión exitosa

### Test 2: Crear un Batch
```bash
import { saveBatchToDatabase } from "@/services/batchService";

const result = await saveBatchToDatabase({
  batch_id: "TEST-001",
  producer_name: "Test Producer",
  location: "Test Location",
  variety: "Test Variety",
  quality: "Test",
  transaction_hash: "0x123456",
  wallet_address: "0xabcdef"
});

console.log(result);
# Deberías ver: { success: true, data: [...] }
```
- [ ] Se guardó exitosamente

### Test 3: Leer Batches
```bash
import { getAllBatches } from "@/services/batchService";

const result = await getAllBatches();
console.log(result.data);

# Deberías ver el batch que creaste arriba
```
- [ ] Se leyó correctamente

### Test 4: QR Generator
- [ ] Abre página `/registrar`
- [ ] Llena el formulario
- [ ] Conecta wallet
- [ ] Envía el registro
- [ ] Verifica que aparezca QR
- [ ] Intenta descargar PNG
- [ ] Intenta descargar SVG
- [ ] Intenta copiar URL
- [ ] Intenta copiar Batch ID
- [ ] Intenta compartir (si está disponible)

---

## 🔍 Verificaciones de Código

### Imports en Registrar.tsx
- [ ] `import { saveBatchToDatabase } from "@/services/batchService";`
- [ ] `import type { BatchRecord } from "@/services/batchService";`

### Función handleSubmit en Registrar.tsx
- [x] Usa `await saveBatchToDatabase(batchData)`
- [x] Maneja resultados (.success, .error)
- [x] Muestra toast de confirmación
- [x] Guarda backup en localStorage

### Archivo .env
- [x] `VITE_SUPABASE_URL` correcto
- [x] `VITE_SUPABASE_PUBLISHABLE_KEY` correcto
- [x] `VITE_SUPABASE_ANON_KEY` correcto
- [x] `VITE_QR_ERROR_CORRECTION_LEVEL=H`
- [x] `VITE_QR_INCLUDE_MARGIN=true`

### QRGenerator.tsx
- [x] Exporta `QRDataExport` interface
- [x] Tiene función `handleDownloadPNG`
- [x] Tiene función `handleDownloadSVG`
- [x] Tiene función `handleCopy`
- [x] Tiene función `handleCopyBatchId`
- [x] Tiene función `handleShare`

### batchService.ts
- [x] Exporta `BatchRecord` interface
- [x] Exporta `saveBatchToDatabase` function
- [x] Exporta `getAllBatches` function
- [x] Exporta `getBatchById` function
- [x] Exporta `testSupabaseConnection` function

---

## 📊 Verificaciones de Base de Datos

### Tabla `batches`
```sql
SELECT * FROM batches LIMIT 1;
```
Columnas que debe tener:
- [ ] `id` (BIGSERIAL)
- [ ] `batch_id` (VARCHAR UNIQUE)
- [ ] `producer_name` (VARCHAR)
- [ ] `location` (VARCHAR)
- [ ] `variety` (VARCHAR)
- [ ] `quality` (VARCHAR)
- [ ] `transaction_hash` (VARCHAR)
- [ ] `wallet_address` (VARCHAR)
- [ ] `metadata` (JSONB)
- [ ] `created_at` (TIMESTAMP)
- [ ] `updated_at` (TIMESTAMP)

### Índices
```sql
SELECT * FROM pg_indexes WHERE tablename = 'batches';
```
- [ ] `idx_batches_batch_id`
- [ ] `idx_batches_created_at`
- [ ] Otros índices (opcional)

### RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'batches';
```
- [ ] "Batches are publicly readable"
- [ ] "Batches can be inserted by authenticated users"

---

## 🚀 Test de Flujo Completo (TODO)

### Flujo: Registrar Lote → BD → Descargar QR

- [ ] Ve a `/registrar`
- [ ] Completa los campos:
  - [ ] Batch ID: `LOTE-VERIFICACION-001`
  - [ ] Productor: `Juan Pérez`
  - [ ] Ubicación: `Piura`
  - [ ] Variedad: `Kent`
  - [ ] Calidad: `Premium`
- [ ] Conecta wallet (MetaMask)
- [ ] Haz clic en "Registrar"
- [ ] Espera confirmación
- [ ] Verifica que muestre QR
- [ ] Descarga PNG
  - [ ] Se descargó sin errores
  - [ ] Archivo tiene nombre `qr-LOTE-VERIFICACION-001-*.png`
- [ ] Descarga SVG
  - [ ] Se descargó sin errores
  - [ ] Archivo tiene extensión `.svg`
- [ ] Copia URL
  - [ ] Se copió sin errores
  - [ ] Puedes pegarlo en navegador
- [ ] Verifica en Supabase
  - [ ] Abre SQL Editor
  - [ ] Ejecuta: `SELECT * FROM batches WHERE batch_id = 'LOTE-VERIFICACION-001';`
  - [ ] El registro aparece en la BD

---

## 🐛 Troubleshooting (Si hay errores)

### Error: "Cannot find module batchService"
- [ ] Verifica que `src/services/batchService.ts` existe
- [ ] Verifica que los imports son correctos
- [ ] Reinicia el servidor dev

### Error: "Table batches does not exist"
- [ ] Ejecuta el SQL de `supabase/migrations/create_batch_tables.sql`
- [ ] Verifica que no haya errores en SQL Editor
- [ ] Refresca la página

### Error: "Invalid API key"
- [ ] Verifica `.env` tiene las claves correctas
- [ ] Verifica que no hay espacios extras
- [ ] Copia claves nuevamente de Supabase

### Error: "Permission denied"
- [ ] Verifica RLS esté habilitado
- [ ] Verifica políticas de seguridad
- [ ] Lee SUPABASE_SETUP.md sección de RLS

### QR no se descarga
- [ ] Abre F12 (consola)
- [ ] Revisa si hay errores en rojo
- [ ] Intenta en navegador diferente
- [ ] Limpia cache del navegador

### No guarda en BD
- [ ] Abre F12 (Network tab)
- [ ] Intenta guardar un batch
- [ ] Revisa si hay errores en requests
- [ ] Verifica conexión a internet

---

## 📈 Verificaciones Finales

### Performance
- [ ] Descarga de PNG < 2 segundos
- [ ] Descarga de SVG < 1 segundo
- [ ] Guardado en BD < 3 segundos

### Seguridad
- [ ] No hay claves sensibles en código
- [ ] RLS habilitado en Supabase
- [ ] Políticas de acceso configuradas
- [ ] Hash de transacción generado

### UX/UI
- [ ] Mensajes de éxito/error claros
- [ ] Spinners mostrados durante carga
- [ ] Botones deshabilitados mientras cargan
- [ ] Responsive en móvil y desktop

### Funcionalidad
- [ ] Registrar lote funciona
- [ ] QR se genera correctamente
- [ ] Se guarda en BD
- [ ] Se lee de BD
- [ ] Se descarga PNG/SVG
- [ ] Se comparte con Web Share API

---

## 📝 Estado Final

Marca esta casilla cuando TODO esté verificado:

- [ ] ✅ **TODO VERIFICADO** - Sistema listo para producción

---

## 🎉 Próximos Pasos

Una vez todo verificado:

1. [ ] Deploy en servidor
2. [ ] Hacer backup de BD
3. [ ] Notificar a usuarios
4. [ ] Monitorear logs
5. [ ] Recopilar feedback

---

## 📞 Contacto/Soporte

Si hay problemas:
1. Revisa la sección de Troubleshooting
2. Consulta SUPABASE_SETUP.md
3. Revisa QUICK_START.md
4. Abre consola (F12) y busca errores
5. Revisa logs de Supabase

---

**Checklist Version**: 1.0
**Última actualización**: 6 de Febrero, 2025
**Estado**: 🟡 Pendiente de configuración Supabase
