# ⚡ QUICK START - Guía Rápida

## 🎯 TL;DR (Para los impacientes)

### Lo que se hizo:
1. ✅ Mejoré los códigos QR (PNG + SVG)
2. ✅ Integré guardado en Supabase
3. ✅ Actualicé Registrar.tsx

### Lo que tienes que hacer:
1. Abrir https://app.supabase.com
2. Copiar script SQL de `supabase/migrations/create_batch_tables.sql`
3. Pegarlo en SQL Editor y ejecutar
4. ¡Listo! El sistema ya guarda en BD

---

## 📦 Cambios Principales

### Nuevo en QRGenerator.tsx
```tsx
// Antes (1 botón)
<Button>Download</Button>

// Ahora (4 botones + opciones)
<Button>PNG</Button>      // Para impresoras normales
<Button>SVG</Button>      // Para alta resolución
<Button>Copy URL</Button> // Copiar link de verificación
<Button>Share</Button>    // Compartir con otros
```

### Nuevo en Registrar.tsx
```tsx
// El lote se guarda automáticamente en Supabase
const supabaseResult = await saveBatchToDatabase(batchData);
```

### Nuevo: batchService.ts
```tsx
import { saveBatchToDatabase } from "@/services/batchService";

// Guardar
await saveBatchToDatabase(batchData);

// Leer
const batches = await getAllBatches();
const oneBatch = await getBatchById("LOTE-001");

// Verificar conexión
const status = await testSupabaseConnection();
```

---

## 🗂️ Archivos Importantes

| Archivo | Que es | Estado |
|---------|--------|--------|
| `src/services/batchService.ts` | Servicio de base de datos | ✅ Nuevo |
| `src/components/QRGenerator.tsx` | Componente mejorado | ✅ Actualizado |
| `src/pages/Registrar.tsx` | Página de registro | ✅ Actualizado |
| `.env` | Variables de configuración | ✅ Actualizado |
| `supabase/migrations/create_batch_tables.sql` | Script para crear tablas | ✅ Listo |
| `SUPABASE_SETUP.md` | Guía de Supabase | ✅ Nuevo |
| `QR_IMPROVEMENTS.md` | Guía de QR improvements | ✅ Nuevo |

---

## ⚡ Ejecución Rápida en 3 Pasos

### Paso 1: Crear Tablas (5 min)
```
1. Abre https://app.supabase.com
2. Inicia sesión
3. Ve a SQL Editor
4. Copia todo de: supabase/migrations/create_batch_tables.sql
5. Pegalo y haz click en "Run"
6. ✅ Listo!
```

### Paso 2: Verificar Conexión (1 min)
```typescript
// Abre la consola del navegador (F12)
import { testSupabaseConnection } from "@/services/batchService";
await testSupabaseConnection();
```

### Paso 3: Probar (5 min)
```
1. Ve a tu app
2. Página /registrar
3. Llena el formulario
4. Envía
5. Verifica que aparezca en Supabase
```

**Tiempo total: ~10 minutos**

---

## 🔍 Cosas que Funcionan Ahora

### QR Generator
```tsx
<QRGenerator batchId="LOTE-001" />
```
Ahora tiene:
- ✅ Download PNG
- ✅ Download SVG
- ✅ Copy URL
- ✅ Copy Batch ID
- ✅ Share (Web Share API)
- ✅ Colores personalizables

### Registro de Lotes
Cuando registras un lote:
1. Se guarda en **Supabase** (BD principal)
2. Se guarda en **localStorage** (backup)
3. Se genera un **hash de transacción**
4. Se asocia tu **wallet address**
5. Se crea un **QR descargable**

### BD (Supabase)
```
Tabla: batches
├── batch_id (PK)
├── producer_name
├── location
├── variety
├── quality
├── transaction_hash
├── wallet_address
├── metadata (JSONB)
└── timestamps
```

---

## 📊 Estructura de Datos Guardados

```javascript
{
  batch_id: "LOTE-2025-001",
  producer_name: "Juan Pérez",
  location: "Piura",
  variety: "Kent",
  quality: "Premium",
  transaction_hash: "0x1234567890abcdef",
  wallet_address: "0xabcdef1234567890",
  metadata: {
    varietyId: "kent",
    emoji: "🥭",
    timestamp: "2025-02-06T10:30:00.000Z",
    network: "Polygon Amoy"
  }
}
```

---

## 🧪 Testing Rápido

### Test 1: Verificar Supabase Conectado
```typescript
import { testSupabaseConnection } from "@/services/batchService";

const result = await testSupabaseConnection();
console.log(result.connected ? "✅ OK" : "❌ Error");
```

### Test 2: Listar Todos los Batches
```typescript
import { getAllBatches } from "@/services/batchService";

const { data } = await getAllBatches();
console.log(data); // Muestra todos los lotes guardados
```

### Test 3: Buscar Batch Específico
```typescript
import { getBatchById } from "@/services/batchService";

const { data } = await getBatchById("LOTE-2025-001");
console.log(data); // Muestra ese lote específico
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Table batches does not exist" | Ejecuta el SQL en Supabase |
| "Invalid API key" | Verifica `.env` está correcto |
| "Permission denied" | Verifica RLS policies en Supabase |
| "No se descarga el QR" | Abre F12, revisa la consola |
| "No guarda en BD" | Verifica conexión internet y `.env` |

---

## 📝 Código Mínimo para Usar

### Guardar un batch
```typescript
import { saveBatchToDatabase } from "@/services/batchService";

const result = await saveBatchToDatabase({
  batch_id: "LOTE-001",
  producer_name: "Juan",
  location: "Piura",
  variety: "Kent",
  quality: "Premium",
  transaction_hash: "0x123...",
  wallet_address: "0xabc..."
});

if (result.success) {
  console.log("✅ Guardado");
} else {
  console.log("❌ Error:", result.error);
}
```

### Mostrar QR mejorado
```typescript
import QRGenerator from "@/components/QRGenerator";

<QRGenerator
  batchId="LOTE-001"
  showDownload={true}
  showCopy={true}
  showShare={true}
/>
```

---

## 📚 Documentación Completa

Para más detalles, lee:
- 📖 `SUPABASE_SETUP.md` - Configuración de BD
- 📖 `QR_IMPROVEMENTS.md` - Mejoras en QR
- 📖 `IMPLEMENTATION_COMPLETE.md` - Todo lo que se hizo

---

## 🎉 Resumen Final

| Componente | Antes | Ahora |
|-----------|-------|-------|
| **QR** | Básico | PNG + SVG + Compartir |
| **BD** | localStorage | Supabase |
| **Registro** | Local only | Supabase + Local |
| **Datos** | En memoria | Persistente en BD |

**Estado**: ✅ Todo listo para usar

**Siguiente**: Crear tablas en Supabase (5 minutos)
