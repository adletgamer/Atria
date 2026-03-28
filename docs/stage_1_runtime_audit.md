# Runtime Audit - Stage 1

**Fecha de auditoría:** 26 de marzo, 2026  
**Objetivo:** Mapear exactamente dónde está la fragmentación en el sistema actual

---

## Resumen Ejecutivo

El sistema actual presenta **fragmentación crítica** en tres niveles:
1. **Persistencia híbrida**: localStorage + Supabase + datos hardcoded
2. **Datos demo en producción**: Arrays DEMO_* mezclados con datos reales
3. **Lógica de negocio en UI**: Construcción de datos en componentes en vez de servicios

### Hallazgos Críticos

- ✅ **3 usos de localStorage** activos en producción
- ⚠️ **2 arrays DEMO_BATCHES/DEMO_DATA** usados como fallback
- ⚠️ **Fallback en cascada** (Supabase → localStorage → Demo)
- ✅ **No se encontraron páginas V2 duplicadas**
- ⚠️ **Construcción de datos de timeline en UI** (Rastrear.tsx, Verify.tsx)

---

## Dashboard

### Fuente actual
- **Primaria:** Supabase (`batches` table)
- **Fallback:** Array hardcoded `DEMO_BATCHES` (5 lotes)
- **Ubicación:** `src/pages/Dashboard.tsx:85-91`

### Problema
```typescript
// Línea 105: Fallback a datos demo si Supabase está vacío
const realBatches = data && data.length > 0 ? data : DEMO_BATCHES;
```

**Impacto:**
- Usuario ve datos ficticios si no hay lotes reales
- Estadísticas calculadas con datos mezclados
- No hay indicador visual de que son datos demo

### Fuente objetivo
- **100% Supabase** con mensaje explícito de "sin datos" cuando esté vacío
- Eliminar `DEMO_BATCHES`
- Mostrar estado vacío con CTA para registrar primer lote

### Datos leídos
- `batches.batch_id`
- `batches.producer_name`
- `batches.location`
- `batches.variety`
- `batches.quality`
- `batches.status`
- `batches.total_kg`
- `batches.price_per_kg`
- `batches.created_at`

### Estadísticas calculadas en UI
```typescript
// Líneas 108-122: Cálculos en componente
const producers = new Set(realBatches.map((b: any) => b.producer_name));
const regions = new Set(realBatches.map((b: any) => b.location));
const totalKg = realBatches.reduce((acc: number, b: any) => acc + (b.total_kg || 0), 0);
const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
```

**Problema:** Estas agregaciones deberían estar en el backend o en un servicio dedicado.

---

## Registrar

### Fuente actual
- **Escritura:** Supabase (`batches` table) vía `saveBatchToDatabase()`
- **Servicio:** `src/services/batchService.ts`
- **Dependencias:** MetaMask wallet, Supabase Auth

### Problema
```typescript
// Línea 159: Hash simulado en vez de transacción real
const refId = crypto.randomUUID();
// ...
transaction_hash: refId,  // No es un hash de blockchain real
```

**Impacto:**
- El campo `transaction_hash` contiene UUIDs, no hashes de blockchain
- Promesa de inmutabilidad blockchain no se cumple
- Metadata contiene `network: "MangoChain Registry"` que no existe

### Fuente objetivo
- Mantener Supabase como fuente principal
- **Migrar:** Integrar contrato inteligente real para obtener hash de transacción
- **Validar:** Wallet conectada antes de permitir registro
- **Separar:** Lógica de blockchain del guardado en DB

### Datos escritos
- `batch_id` (manual, usuario)
- `producer_name` (manual, pre-llenado desde profile)
- `location` (select)
- `variety` (select desde `VARIETY_OPTIONS`)
- `quality` (select)
- `transaction_hash` (UUID generado)
- `wallet_address` (desde MetaMask)
- `total_kg` (opcional)
- `price_per_kg` (opcional)
- `is_listed` (boolean)
- `metadata` (JSON con varietyId, timestamp, network, emoji)

### Validaciones actuales
- ✅ Usuario autenticado
- ✅ Wallet conectada
- ✅ Campos obligatorios: batch_id, producer_name, variety, quality
- ❌ No valida unicidad de batch_id antes de submit
- ❌ No valida formato de batch_id

---

## Rastrear

### Fuente actual
- **Primaria:** Supabase (`batches` table)
- **Fallback 1:** localStorage key `"lotes"`
- **Fallback 2:** Objeto hardcoded `DEMO_DATA`
- **Ubicación:** `src/pages/Rastrear.tsx:101-112, 136-147`

### Problema
```typescript
// Líneas 136-147: Triple fallback en cascada
const { data } = await supabase.from("batches").select("*").eq("batch_id", searchValue).maybeSingle();

let result: any = data;
if (!result) {
  const local = JSON.parse(localStorage.getItem("lotes") || "[]");
  result = local.find((l: any) => l.loteId === searchValue || l.batch_id === searchValue);
}
if (!result) {
  result = DEMO_DATA[searchValue];
}
```

**Impacto crítico:**
- Usuario no sabe de dónde vienen los datos
- localStorage puede contener datos obsoletos/corruptos
- DEMO_DATA tiene solo 2 lotes hardcoded
- Inconsistencia en nombres de campos (`loteId` vs `batch_id`)

### Fuente objetivo
- **Solo Supabase**
- Eliminar localStorage fallback
- Eliminar DEMO_DATA
- Mensaje claro: "Lote no encontrado en base de datos"

### Datos leídos
- `batch_id`
- `producer_name`
- `location`
- `variety`
- `quality`
- `status` (para determinar paso activo en timeline)
- `total_kg`
- `price_per_kg`
- `created_at`
- `transaction_hash`

### Construcción de datos en UI
```typescript
// Líneas 155-170: Timeline construido en componente
setLoteData({
  ...result,
  steps: i.steps.map((step, idx) => ({
    ...step,
    description: idx === 0 ? `${step.descTpl || step.desc} ${producerName}` : step.desc,
    completed: idx <= activeStep,
    current: idx === activeStep,
    date: idx === 0 ? new Date(createdDate).toLocaleDateString(...) : ...,
  })),
});
```

**Problema:** Lógica de negocio (estados de timeline) mezclada con presentación.

---

## Verify

### Fuente actual
- **Primaria:** Supabase (`batches` table)
- **Tracking:** Hook `useScanTracking()` → localStorage
- **Ubicación:** `src/pages/Verify.tsx:28-105`

### Problema
```typescript
// Línea 40: logScan guarda en localStorage
logScan(id, false);  // Guarda en localStorage, no en DB

// Líneas 45-86: Timeline hardcoded en componente
const timelineData = {
  steps: [
    { id: "1", title: `Producer - ${data.location}`, ... },
    { id: "2", title: "Exporter", ... },
    { id: "3", title: "Supermarket - Lima", ... },
    { id: "4", title: "Final Customer", ... },
  ],
};
```

**Impacto:**
- Escaneos QR se pierden al limpiar localStorage
- No hay persistencia de verificaciones en DB
- Timeline tiene pasos hardcoded ("Supermarket - Lima")
- No refleja cadena de suministro real

### Fuente objetivo
- **Batches:** Solo Supabase
- **Verificaciones:** Migrar a tabla `qr_verifications` (ya existe en schema)
- **Timeline:** Construir desde eventos reales en DB
- Eliminar `useScanTracking` localStorage hook

### Datos leídos
- `batch_id`
- `producer_name`
- `location`
- `quality`
- `transaction_hash`
- `created_at`
- `status`
- `variety`

### Hook useScanTracking
**Ubicación:** `src/hooks/useScanTracking.tsx`

```typescript
// Líneas 23-29: Lee de localStorage
const stored = localStorage.getItem(STORAGE_KEY);
if (stored) {
  setScans(JSON.parse(stored));
}

// Línea 59: Escribe a localStorage
localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScans));
```

**Problema:** Datos de analytics críticos solo en cliente, se pierden fácilmente.

---

## Marketplace

### Fuente actual
- **Única:** Supabase (`batches` table con `is_listed = true`)
- **Ubicación:** `src/pages/Marketplace.tsx:76-85`

### Problema
✅ **Sin problemas críticos** - Esta página ya usa solo Supabase

### Fuente objetivo
- Mantener implementación actual
- Agregar paginación cuando crezca el dataset
- Considerar filtros por región/variedad en backend

### Datos leídos
- `batch_id`
- `variety`
- `producer_name`
- `location`
- `quality`
- `total_kg`
- `price_per_kg`
- `is_listed`
- `created_at`

---

## Matriz: Pantalla → Fuente de Datos

| Pantalla | Fuente Primaria | Fallback 1 | Fallback 2 | Estado |
|----------|----------------|------------|------------|--------|
| **Dashboard** | Supabase | DEMO_BATCHES | - | ⚠️ Crítico |
| **Registrar** | Supabase (write) | - | - | ⚠️ Hash falso |
| **Rastrear** | Supabase | localStorage | DEMO_DATA | 🔴 Crítico |
| **Verify** | Supabase | - | - | ⚠️ Timeline hardcoded |
| **Marketplace** | Supabase | - | - | ✅ OK |

---

## Uso de localStorage - Inventario Completo

### 1. Wallet Persistence
**Ubicación:** `src/hooks/useMetaMask.tsx:135-137, 161-162`
```typescript
localStorage.removeItem('walletConnected');
localStorage.removeItem('walletAddress');
// ...
localStorage.setItem('walletConnected', 'true');
localStorage.setItem('walletAddress', address);
```
**Propósito:** Recordar conexión de wallet entre sesiones  
**Acción:** ✅ **MANTENER** - Uso válido para UX

### 2. Scan Tracking
**Ubicación:** `src/hooks/useScanTracking.tsx:26, 59`
```typescript
const stored = localStorage.getItem(STORAGE_KEY);
localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScans));
```
**Propósito:** Guardar historial de escaneos QR  
**Acción:** 🔴 **MIGRAR** a tabla `qr_verifications`

### 3. Batch Fallback
**Ubicación:** `src/pages/Rastrear.tsx:142`
```typescript
const local = JSON.parse(localStorage.getItem("lotes") || "[]");
```
**Propósito:** Fallback para búsqueda de lotes  
**Acción:** 🔴 **ELIMINAR** - Fuente de verdad debe ser DB

### 4. Language Preference
**Ubicación:** `src/hooks/useLanguage.tsx` (inferido)
**Acción:** ✅ **MANTENER** - Preferencia de UI

---

## Arrays Mock/Hardcoded en Producción

### 1. DEMO_BATCHES
**Ubicación:** `src/pages/Dashboard.tsx:85-91`
```typescript
const DEMO_BATCHES = [
  { batch_id: "MG-2025-001", producer_name: "Juan García", ... },
  { batch_id: "MG-2025-002", producer_name: "María López", ... },
  { batch_id: "MG-2025-003", producer_name: "Carlos Ruiz", ... },
  { batch_id: "MG-2025-004", producer_name: "Ana Torres", ... },
  { batch_id: "MG-2025-005", producer_name: "Pedro Flores", ... },
];
```
**Uso:** Fallback cuando Supabase está vacío  
**Acción:** 🔴 **ELIMINAR**

### 2. DEMO_DATA
**Ubicación:** `src/pages/Rastrear.tsx:101-112`
```typescript
const DEMO_DATA: Record<string, any> = {
  "MG-2025-001": { batch_id: "MG-2025-001", producer_name: "Juan García", ... },
  "MG-2025-002": { batch_id: "MG-2025-002", producer_name: "María López", ... },
};
```
**Uso:** Fallback final en búsqueda  
**Acción:** 🔴 **ELIMINAR**

### 3. Timeline Steps (Hardcoded)
**Ubicación:** `src/pages/Verify.tsx:53-85`
```typescript
steps: [
  { id: "1", title: `Producer - ${data.location}`, ... },
  { id: "2", title: "Exporter", description: "In export process", ... },
  { id: "3", title: "Supermarket - Lima", ... },  // ← Hardcoded
  { id: "4", title: "Final Customer", ... },
]
```
**Acción:** 🔴 **MIGRAR** a tabla de eventos de cadena de suministro

---

## Servicios que Leen/Escriben Lotes

### batchService.ts
**Ubicación:** `src/services/batchService.ts`

#### Funciones exportadas:
1. **saveBatchToDatabase(batchData: BatchRecord)**
   - Escribe a `batches` table
   - Vincula con `user.id` como `producer_id`
   - Maneja duplicados (error 23505)

2. **getAllBatches()**
   - Lee todos los batches ordenados por `created_at DESC`
   - No tiene paginación

3. **getBatchById(batchId: string)**
   - Lee un batch específico por `batch_id`
   - Usa `.single()` - falla si no existe

**Problemas:**
- ❌ No hay `updateBatch()`
- ❌ No hay `deleteBatch()`
- ❌ No hay `listBatchesForProducer(producerId)`
- ❌ `getAllBatches()` sin límite puede causar problemas de performance

---

## Componentes que Construyen Datos desde UI

### 1. Dashboard - Agregaciones
**Ubicación:** `src/pages/Dashboard.tsx:108-122`
- Calcula productores únicos
- Calcula regiones únicas
- Suma total_kg
- Promedia price_per_kg

**Problema:** Estas métricas deberían ser vistas en DB o endpoints dedicados.

### 2. Dashboard - Quality Distribution
**Ubicación:** `src/pages/Dashboard.tsx:127-135`
- Agrupa por `quality`
- Calcula porcentajes

**Problema:** Lógica de agregación en UI.

### 3. Rastrear - Timeline Construction
**Ubicación:** `src/pages/Rastrear.tsx:155-170`
- Mapea pasos de timeline
- Calcula fechas estimadas
- Determina paso activo desde `status`

**Problema:** Lógica de negocio compleja en componente.

### 4. Verify - Timeline Hardcoded
**Ubicación:** `src/pages/Verify.tsx:45-86`
- Construye timeline con pasos fijos
- Calcula fechas estimadas
- Determina completitud desde `status`

**Problema:** Pasos hardcoded, no refleja realidad.

---

## Qué Cortar (Eliminar)

### Prioridad Alta 🔴
1. ✂️ `DEMO_BATCHES` array en Dashboard.tsx
2. ✂️ `DEMO_DATA` object en Rastrear.tsx
3. ✂️ localStorage fallback en Rastrear.tsx línea 142
4. ✂️ `useScanTracking` hook (migrar a DB)
5. ✂️ Timeline hardcoded en Verify.tsx

### Prioridad Media ⚠️
6. ✂️ Agregaciones en Dashboard (mover a backend)
7. ✂️ Timeline construction en Rastrear (mover a servicio)
8. ✂️ Hash UUID fake (reemplazar con blockchain real)

### Mantener ✅
- localStorage para wallet persistence
- localStorage para language preference
- Estructura actual de batchService.ts (expandir)

---

## Qué Migrar (Transformar)

### 1. Scan Tracking → qr_verifications table
**De:** localStorage en `useScanTracking.tsx`  
**A:** Tabla Supabase `qr_verifications`  
**Campos a migrar:**
- `batch_id`
- `timestamp` → `verified_at`
- `success` → (implícito si existe registro)
- Agregar: `device_fingerprint`, `ip_address`, `user_agent`

### 2. Timeline Steps → supply_chain_events table (nueva)
**De:** Hardcoded arrays en Rastrear.tsx y Verify.tsx  
**A:** Nueva tabla con eventos reales  
**Estructura sugerida:**
```sql
CREATE TABLE supply_chain_events (
  id UUID PRIMARY KEY,
  batch_id VARCHAR REFERENCES batches(batch_id),
  event_type VARCHAR NOT NULL,  -- 'registered', 'exported', 'in_transit', 'delivered'
  location VARCHAR,
  actor_id UUID,
  metadata JSONB,
  occurred_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Agregaciones → Vistas materializadas
**De:** Cálculos en Dashboard.tsx  
**A:** Vistas en Supabase  
**Ejemplos:**
- `batch_statistics` (total, por región, por calidad)
- `producer_metrics` (lotes por productor, kg totales)
- `quality_distribution` (ya existe lógica, mover a DB)

---

## Definition of Done - Checklist

### Documentación ✅
- [x] Identificar qué lee cada pantalla
- [x] Identificar fuentes de datos (primaria + fallbacks)
- [x] Identificar todos los usos de localStorage
- [x] Identificar todos los arrays mock/hardcoded
- [x] Identificar servicios que leen/escriben lotes
- [x] Identificar componentes que construyen datos en UI
- [x] Crear matriz pantalla → fuente de datos

### Análisis ✅
- [x] Documentar problemas de cada fuente
- [x] Definir fuente objetivo para cada pantalla
- [x] Clasificar qué cortar vs qué migrar
- [x] Priorizar acciones (Alta/Media/Baja)

### Próximos Pasos
- [ ] Ejecutar BLOQUE 2: Diseño del esquema core
- [ ] Crear plan de migración detallado
- [ ] Implementar nuevas tablas (supply_chain_events, etc.)
- [ ] Migrar datos de localStorage a DB
- [ ] Eliminar código legacy identificado

---

## Notas Técnicas

### Inconsistencias de Nomenclatura
- `loteId` vs `batch_id` (usar `batch_id` consistentemente)
- `productor` vs `producer_name` (usar `producer_name`)
- `ubicacion` vs `location` (usar `location`)
- `calidad` vs `quality` (usar `quality`)

### Campos No Utilizados en DB
Según schema, existen pero no se usan en UI:
- `batches.producer_id` (FK a profiles, se llena pero no se consulta)
- `batches.status` (se usa en Rastrear/Verify pero no se actualiza nunca)
- `batches.updated_at` (auto, pero no se muestra)

### Tablas Existentes No Utilizadas
- `orders` - Existe en schema pero no hay UI para crear/ver órdenes
- `batch_audit_log` - Existe en migration pero no se usa
- `qr_verifications` - Existe en migration pero se usa localStorage

---

**Fin del Runtime Audit - Stage 1**
