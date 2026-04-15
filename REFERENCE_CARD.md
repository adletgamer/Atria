# ⚡ REFERENCE CARD - Tarjeta de Referencia Rápida

## 🚀 SETUP EN 30 SEGUNDOS

```bash
# 1. Ir a Supabase
https://app.supabase.com

# 2. SQL Editor → Copiar + Ejecutar
supabase/migrations/create_batch_tables.sql

# 3. ¡Listo!
```

---

## 📝 COMANDOS MÁS USADOS

### En la Consola del Navegador (F12)

```typescript
// Test conexión
import { testSupabaseConnection } from "@/services/batchService";
await testSupabaseConnection();

// Guardar batch
import { saveBatchToDatabase } from "@/services/batchService";
await saveBatchToDatabase({
  batch_id: "LOTE-001",
  producer_name: "Juan",
  location: "Piura",
  variety: "Kent",
  quality: "Premium",
  transaction_hash: "0x123",
  wallet_address: "0xabc"
});

// Leer lotes
import { getAllBatches } from "@/services/batchService";
const res = await getAllBatches();
console.log(res.data);

// Buscar lote
import { getBatchById } from "@/services/batchService";
const res = await getBatchById("LOTE-001");
console.log(res.data);
```

---

## 📊 SQL RÁPIDO

```sql
-- Ver todos los batches
SELECT * FROM batches LIMIT 10;

-- Contar lotes
SELECT COUNT(*) FROM batches;

-- Por productor
SELECT * FROM batches WHERE producer_name = 'Juan';

-- Ordenado por fecha
SELECT * FROM batches ORDER BY created_at DESC LIMIT 5;

-- Con filtros
SELECT * FROM batches 
WHERE location = 'Piura' 
  AND quality = 'Premium' 
LIMIT 10;
```

---

## 🎨 COMPONENTE QR

```tsx
// Básico
<QRGenerator batchId="LOTE-001" />

// Con todas las opciones
<QRGenerator
  batchId="LOTE-001"
  size={250}
  showDownload={true}
  showCopy={true}
  showShare={true}
  bgColor="#ffffff"
  fgColor="#ff6b35"
  onDataChange={(data) => console.log(data)}
/>

// Personalizado
<QRGenerator
  batchId="LOTE-001"
  size={150}
  showDownload={false}
  showCopy={true}
  showShare={false}
/>
```

---

## 🔧 ESTRUCTURA DATOS

```typescript
// BatchRecord que se guarda
{
  batch_id: "LOTE-2025-001",
  producer_name: "Juan Pérez",
  location: "Piura",
  variety: "Kent",
  quality: "Premium",
  transaction_hash: "0x1234...",
  wallet_address: "0xabcd...",
  metadata: {
    emoji: "🥭",
    timestamp: "2025-02-06T...",
    network: "Polygon Amoy"
  }
}
```

---

## 📁 ARCHIVOS CLAVE

```
src/services/batchService.ts        ← BD logic
src/components/QRGenerator.tsx       ← QR component
src/pages/Registrar.tsx              ← Usa ambos
.env                                 ← Config
supabase/migrations/...sql           ← Tablas
```

---

## 🐛 ERRORES COMUNES

| Error | Solución |
|-------|----------|
| "Table doesn't exist" | Ejecuta SQL en Supabase |
| "Invalid API key" | Verifica .env |
| "Permission denied" | Revisa RLS policies |
| "No se descarga QR" | F12 → Revisa console |
| "No guarda en BD" | Verifica internet + .env |

---

## 📚 DOCUMENTOS PRINCIPALES

| Documento | Para | Tiempo |
|-----------|------|--------|
| QUICK_START.md | Empezar | 5 min |
| SUPABASE_SETUP.md | Config BD | 15 min |
| EXAMPLES.md | Código | 20 min |
| VERIFICATION_CHECKLIST.md | Verificar | 30 min |
| INDEX.md | Navegación | 5 min |

---

## ✅ CHECKLIST SETUP

- [ ] Crear tablas en Supabase (SQL)
- [ ] Verificar conexión (testSupabaseConnection)
- [ ] Registrar lote de prueba
- [ ] Verificar en BD (SELECT *)
- [ ] Descargar QR (PNG y SVG)
- [ ] Leer desde BD (getAllBatches)

**Tiempo total: ~25 minutos**

---

## 🎯 VARIABLES .ENV

```env
# Ya configuradas:
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_ANON_KEY
VITE_QR_ERROR_CORRECTION_LEVEL=H
VITE_QR_INCLUDE_MARGIN=true
```

---

## 📞 HELP

```
¿Qué hago si...?

...tengo un error?
→ Revisa QUICK_START.md troubleshooting

...necesito ejemplos?
→ Lee EXAMPLES.md

...no puedo crear tablas?
→ Sigue SUPABASE_SETUP.md paso a paso

...quiero verificar todo?
→ Usa VERIFICATION_CHECKLIST.md

...no entiendo la arquitectura?
→ Mira RESUMEN_VISUAL.md
```

---

## 🎉 ESTADO

✅ QR mejorado
✅ BD integrada
✅ Código listo
✅ Documentación completa

**Próximo**: Crear tablas en Supabase (10 min)

---

**Versión**: 1.0 | **Fecha**: 6 Feb 2025 | **Estado**: ✅ Listo
