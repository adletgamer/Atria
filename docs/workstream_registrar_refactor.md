# Workstream: Refactorización de Página Registrar

**Fecha:** 26 de marzo, 2026  
**Prioridad:** CRÍTICA - Workstream D, Paso 1  
**Objetivo:** Convertir Registrar de formulario aislado a creador de entidades core del sistema

---

## 1. Análisis del Problema Actual

### Estado Actual (Registrar.tsx)

```typescript
// PROBLEMA 1: Datos mezclados en una sola tabla
const batchData: BatchRecord = {
  batch_id: formData.loteId,              // ← Identificador
  producer_name: formData.productor,      // ← Atributo
  location: formData.ubicacion,           // ← Atributo
  variety: formData.variedad,             // ← Atributo
  quality: formData.calidad,              // ← Atributo
  transaction_hash: refId,                // ← UUID fake, no blockchain
  wallet_address: account,                // ← Atributo
  total_kg: formData.totalKg,             // ← Atributo
  price_per_kg: formData.pricePerKg,      // ← Atributo
  is_listed: formData.isListed,           // ← Atributo
  metadata: { ... },                      // ← Cajón de sastre
};

// PROBLEMA 2: Un solo INSERT a tabla monolítica
await saveBatchToDatabase(batchData);

// PROBLEMA 3: No hay eventos
// No se crea lot_events entry
// No se registra trust_state inicial
// No hay trazabilidad de la creación

// PROBLEMA 4: Hash falso
const refId = crypto.randomUUID();  // ← No es blockchain
```

### Problemas Identificados

| # | Problema | Impacto | Prioridad |
|---|----------|---------|-----------|
| 1 | **Tabla monolítica** | Todos los datos en `batches`, imposible evolucionar | 🔴 Crítico |
| 2 | **Sin eventos** | No hay timeline real, se inventa en UI | 🔴 Crítico |
| 3 | **Sin trust_state** | No hay base para scoring futuro | 🔴 Crítico |
| 4 | **Hash UUID fake** | Promesa de blockchain no se cumple | ⚠️ Alto |
| 5 | **Metadata JSONB caótico** | Datos importantes mezclados con UI (emoji) | ⚠️ Alto |
| 6 | **Sin validaciones de dominio** | Solo validaciones de UI | ⚠️ Medio |
| 7 | **Sin separación de concerns** | Componente hace todo | ⚠️ Medio |

---

## 2. Schema Revisado - Core de Etapa 1

### Cambios vs Schema Original

**ELIMINAR de Etapa 1:**
- ❌ `orders` table (congelada para Stage 2)
- ❌ `marketplace` logic (congelada)
- ❌ Campos blockchain reales (preparar estructura, no implementar)

**AGREGAR para Etapa 1:**
- ✅ `lot_attributes` (separar atributos mutables)
- ✅ `lot_events` (eventos inmutables)
- ✅ `trust_states` (base para scoring)
- ✅ `evidences` (preparar para Stage 2)

### 2.1 Tabla: lots (Core Identity)

```sql
CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id VARCHAR(100) UNIQUE NOT NULL,
  producer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Campos inmutables de identidad
  origin_location VARCHAR(255) NOT NULL,
  harvest_date DATE,
  
  -- Metadata técnica (no de negocio)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Constraints
ALTER TABLE lots ADD CONSTRAINT check_lot_id_format
  CHECK (lot_id ~ '^[A-Z]{2,4}-\d{4}-\d{3,6}$');

-- Índices
CREATE UNIQUE INDEX idx_lots_lot_id ON lots(lot_id);
CREATE INDEX idx_lots_producer_id ON lots(producer_id);
CREATE INDEX idx_lots_created_at ON lots(created_at DESC);
CREATE INDEX idx_lots_origin_location ON lots(origin_location);
```

**Justificación:**
- **Solo identidad inmutable**: lot_id, producer_id, origin_location, harvest_date
- **Sin atributos mutables**: variedad, calidad, peso → van a `lot_attributes`
- **Sin blockchain fields**: transaction_hash, wallet_address → van a `anchor_jobs` (Stage 2)
- **metadata mínimo**: Solo datos técnicos del sistema, no de negocio

### 2.2 Tabla: lot_attributes (Mutable Properties)

```sql
CREATE TABLE lot_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  attribute_key VARCHAR(100) NOT NULL,
  attribute_value TEXT NOT NULL,
  value_type VARCHAR(50) NOT NULL DEFAULT 'string',
  source VARCHAR(100),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(lot_id, attribute_key)
);

-- Índices
CREATE INDEX idx_lot_attrs_lot_id ON lot_attributes(lot_id);
CREATE INDEX idx_lot_attrs_key ON lot_attributes(attribute_key);
CREATE INDEX idx_lot_attrs_verified ON lot_attributes(verified);
```

**Atributos iniciales en Registrar:**
- `variety` (variedad de mango)
- `quality` (grado de calidad)
- `total_kg` (peso total)
- `price_per_kg` (precio por kg)
- `is_listed` (visible en marketplace)
- `wallet_address` (dirección de wallet)

**Justificación:**
- **Flexibilidad**: Agregar atributos sin migrations
- **Versionado**: Histórico de cambios (con trigger)
- **Verificación**: Campo `verified` para atributos validados
- **Tipado**: `value_type` permite validaciones

### 2.3 Tabla: lot_events (Immutable Timeline)

```sql
CREATE TABLE lot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  location VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_lot_events_lot_id ON lot_events(lot_id);
CREATE INDEX idx_lot_events_type ON lot_events(event_type);
CREATE INDEX idx_lot_events_category ON lot_events(event_category);
CREATE INDEX idx_lot_events_occurred_at ON lot_events(occurred_at DESC);
```

**Event Types para Registrar:**
- `lot.created` (evento inicial)
- `lot.attribute_set` (cuando se agregan atributos)
- `lot.listed` (cuando se lista en marketplace)

**Event Categories:**
- `lifecycle` (creación, eliminación)
- `attribute_change` (cambios de atributos)
- `verification` (escaneos QR)
- `custody` (cambios de custodia - Stage 2)

**Justificación:**
- **Append-only**: No UPDATE/DELETE
- **Reconstrucción**: Timeline completo desde eventos
- **Auditoría**: Quién hizo qué y cuándo
- **Categorización**: Facilita queries y filtros

### 2.4 Tabla: trust_states (Trust Scoring Base)

```sql
CREATE TABLE trust_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  trust_score NUMERIC(5, 2) DEFAULT 0.00,
  verification_count INTEGER DEFAULT 0,
  evidence_count INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  flags JSONB DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(lot_id)
);

-- Índices
CREATE UNIQUE INDEX idx_trust_states_lot_id ON trust_states(lot_id);
CREATE INDEX idx_trust_states_score ON trust_states(trust_score DESC);
CREATE INDEX idx_trust_states_verified_at ON trust_states(last_verified_at DESC);
```

**Trust State Inicial en Registrar:**
```json
{
  "lot_id": "uuid-del-lote",
  "trust_score": 10.00,  // Score base por creación
  "verification_count": 0,
  "evidence_count": 0,
  "flags": [],
  "computed_at": "2026-03-26T23:00:00Z"
}
```

**Justificación:**
- **Base para scoring**: Aunque no se calcule sofisticadamente ahora
- **Incremental**: Se actualiza con cada verificación
- **Flags**: Permite marcar anomalías (múltiples escaneos mismo device, etc.)
- **Snapshot**: Estado actual, no histórico (eventos tienen histórico)

### 2.5 Tabla: evidences (Preparación Stage 2)

```sql
CREATE TABLE evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  evidence_type VARCHAR(100) NOT NULL,
  evidence_url TEXT,
  evidence_hash VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_evidences_lot_id ON evidences(lot_id);
CREATE INDEX idx_evidences_type ON evidences(evidence_type);
CREATE INDEX idx_evidences_verified ON evidences(verified);
```

**No se usa en Registrar Stage 1**, pero estructura preparada para:
- Fotos de lote
- Certificados de calidad
- Documentos de exportación

---

## 3. Flujo Nuevo de Creación de Lote

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO EN REGISTRAR                      │
│  1. Llena formulario                                         │
│  2. Click "Registrar Lote"                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              COMPONENTE Registrar.tsx                        │
│  - Validaciones de UI                                        │
│  - Formateo de datos                                         │
│  - Llamada a lotService.createLot()                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  lotService.createLot()                      │
│  TRANSACCIÓN ATÓMICA:                                        │
│  1. INSERT lots (identidad core)                             │
│  2. INSERT lot_attributes (N atributos)                      │
│  3. INSERT lot_events (evento "lot.created")                 │
│  4. INSERT trust_states (estado inicial)                     │
│  5. COMMIT o ROLLBACK                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│  lots:           1 row                                       │
│  lot_attributes: 6 rows (variety, quality, kg, price, etc)   │
│  lot_events:     1 row (lot.created)                         │
│  trust_states:   1 row (score inicial)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  RESPUESTA AL USUARIO                        │
│  - Éxito: Mostrar QR, redirigir a Rastrear                   │
│  - Error: Mostrar mensaje, mantener formulario               │
└─────────────────────────────────────────────────────────────┘
```

### Secuencia Detallada

```typescript
// PASO 1: Usuario submits formulario
onSubmit(formData) {
  // Validaciones UI
  if (!formData.loteId || !formData.variedad) {
    toast.error("Campos obligatorios");
    return;
  }
  
  // PASO 2: Preparar payload
  const lotPayload = {
    lot_id: formData.loteId,
    producer_id: user.id,
    origin_location: formData.ubicacion,
    harvest_date: formData.fechaCosecha || null,
    attributes: {
      variety: formData.variedad,
      quality: formData.calidad,
      total_kg: formData.totalKg,
      price_per_kg: formData.pricePerKg,
      is_listed: formData.isListed,
      wallet_address: account,
    }
  };
  
  // PASO 3: Llamar servicio
  const result = await lotService.createLot(lotPayload);
  
  // PASO 4: Manejar respuesta
  if (result.success) {
    toast.success("Lote registrado");
    navigate(`/rastrear?lote=${result.data.lot_id}`);
  } else {
    toast.error(result.error);
  }
}
```

---

## 4. Responsabilidades del Componente (Registrar.tsx)

### QUÉ DEBE HACER

✅ **Presentación y UX**
- Renderizar formulario
- Validaciones de UI (campos vacíos, formatos)
- Feedback visual (loading, errores)
- Navegación post-registro

✅ **Orquestación simple**
- Recoger datos del formulario
- Llamar a `lotService.createLot()`
- Manejar respuesta (éxito/error)

✅ **Integración con hooks**
- `useAuth()` para obtener user.id
- `useMetaMask()` para obtener wallet address
- `useLanguage()` para i18n

### QUÉ NO DEBE HACER

❌ **Lógica de negocio**
- NO construir objetos complejos
- NO hacer múltiples INSERTs
- NO calcular trust scores
- NO generar eventos

❌ **Acceso directo a DB**
- NO llamar `supabase.from("lots").insert()`
- NO manejar transacciones
- NO conocer estructura de tablas

❌ **Persistencia dual**
- NO guardar en localStorage
- NO usar DEMO_DATA
- NO tener fallbacks

### Estructura del Componente

```typescript
// src/pages/Registrar.tsx

import { lotService } from "@/services/lotService";
import { useAuth } from "@/hooks/useAuth";
import { useMetaMask } from "@/hooks/useMetaMask";

const Registrar = () => {
  const { user, profile } = useAuth();
  const { account } = useMetaMask();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    loteId: "",
    ubicacion: "Piura",
    variedad: "",
    calidad: "",
    totalKg: "",
    pricePerKg: "",
    isListed: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones UI
    if (!formData.loteId || !formData.variedad || !formData.calidad) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    setIsLoading(true);

    try {
      // Preparar payload
      const payload = {
        lot_id: formData.loteId,
        producer_id: user!.id,
        origin_location: formData.ubicacion,
        attributes: {
          variety: formData.variedad,
          quality: formData.calidad,
          total_kg: formData.totalKg ? parseFloat(formData.totalKg) : null,
          price_per_kg: formData.pricePerKg ? parseFloat(formData.pricePerKg) : null,
          is_listed: formData.isListed,
          wallet_address: account || null,
        }
      };

      // Llamar servicio
      const result = await lotService.createLot(payload);

      if (result.success) {
        toast.success("Lote registrado exitosamente");
        navigate(`/rastrear?lote=${result.data.lot_id}`);
      } else {
        toast.error(result.error || "Error al registrar lote");
      }
    } catch (error) {
      console.error("Error en registro:", error);
      toast.error("Error inesperado al registrar lote");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... JSX del formulario
  );
};
```

---

## 5. Responsabilidades del Servicio (lotService.ts)

### QUÉ DEBE HACER

✅ **Lógica de negocio**
- Validar reglas de dominio
- Coordinar transacciones
- Generar eventos
- Calcular trust state inicial

✅ **Persistencia**
- INSERTs a múltiples tablas
- Manejo de transacciones
- Rollback en caso de error

✅ **Integridad**
- Validar unicidad de lot_id
- Validar formato de lot_id
- Validar relaciones (producer_id existe)

### QUÉ NO DEBE HACER

❌ **UI/UX**
- NO mostrar toasts
- NO manejar navegación
- NO conocer estado de formularios

❌ **Autenticación**
- NO validar si user está logueado (componente lo hace)
- NO obtener user.id (se pasa como parámetro)

### Estructura del Servicio

```typescript
// src/services/lotService.ts

import { supabase } from "@/integrations/supabase/client";

export interface CreateLotPayload {
  lot_id: string;
  producer_id: string;
  origin_location: string;
  harvest_date?: string | null;
  attributes: Record<string, any>;
}

export interface CreateLotResult {
  success: boolean;
  data?: {
    id: string;
    lot_id: string;
  };
  error?: string;
}

export const lotService = {
  /**
   * Crea un lote completo con todos sus componentes
   * TRANSACCIÓN ATÓMICA: lots + lot_attributes + lot_events + trust_states
   */
  async createLot(payload: CreateLotPayload): Promise<CreateLotResult> {
    try {
      // VALIDACIÓN 1: Formato de lot_id
      if (!this.validateLotIdFormat(payload.lot_id)) {
        return {
          success: false,
          error: "Formato de lot_id inválido. Usa: XX-YYYY-NNN"
        };
      }

      // VALIDACIÓN 2: Unicidad de lot_id
      const exists = await this.lotIdExists(payload.lot_id);
      if (exists) {
        return {
          success: false,
          error: "El lot_id ya existe. Usa uno diferente."
        };
      }

      // TRANSACCIÓN ATÓMICA
      const { data, error } = await supabase.rpc('create_lot_complete', {
        p_lot_id: payload.lot_id,
        p_producer_id: payload.producer_id,
        p_origin_location: payload.origin_location,
        p_harvest_date: payload.harvest_date,
        p_attributes: payload.attributes
      });

      if (error) {
        console.error("Error en create_lot_complete:", error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: {
          id: data.lot_id,
          lot_id: payload.lot_id
        }
      };

    } catch (error: any) {
      console.error("Exception en createLot:", error);
      return {
        success: false,
        error: error.message || "Error inesperado"
      };
    }
  },

  /**
   * Valida formato de lot_id: XX-YYYY-NNN
   */
  validateLotIdFormat(lotId: string): boolean {
    const regex = /^[A-Z]{2,4}-\d{4}-\d{3,6}$/;
    return regex.test(lotId);
  },

  /**
   * Verifica si un lot_id ya existe
   */
  async lotIdExists(lotId: string): Promise<boolean> {
    const { data } = await supabase
      .from("lots")
      .select("id")
      .eq("lot_id", lotId)
      .maybeSingle();
    
    return !!data;
  },

  /**
   * Obtiene un lote por lot_id
   */
  async getLotByLotId(lotId: string) {
    const { data, error } = await supabase
      .from("lots")
      .select(`
        *,
        lot_attributes(*),
        lot_events(*),
        trust_states(*)
      `)
      .eq("lot_id", lotId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }
};
```

---

## 6. Función RPC: create_lot_complete

Esta función PostgreSQL maneja la transacción atómica completa.

```sql
-- src/supabase/migrations/create_lot_complete_function.sql

CREATE OR REPLACE FUNCTION create_lot_complete(
  p_lot_id VARCHAR,
  p_producer_id UUID,
  p_origin_location VARCHAR,
  p_harvest_date DATE,
  p_attributes JSONB
)
RETURNS TABLE (
  lot_id UUID,
  lot_lot_id VARCHAR
) AS $$
DECLARE
  v_lot_id UUID;
  v_attr_key TEXT;
  v_attr_value TEXT;
BEGIN
  -- PASO 1: Insertar en lots
  INSERT INTO lots (
    lot_id,
    producer_id,
    origin_location,
    harvest_date
  ) VALUES (
    p_lot_id,
    p_producer_id,
    p_origin_location,
    p_harvest_date
  )
  RETURNING id INTO v_lot_id;

  -- PASO 2: Insertar atributos
  FOR v_attr_key, v_attr_value IN
    SELECT key, value::text
    FROM jsonb_each_text(p_attributes)
  LOOP
    INSERT INTO lot_attributes (
      lot_id,
      attribute_key,
      attribute_value,
      value_type,
      source
    ) VALUES (
      v_lot_id,
      v_attr_key,
      v_attr_value,
      CASE
        WHEN v_attr_value ~ '^\d+(\.\d+)?$' THEN 'numeric'
        WHEN v_attr_value IN ('true', 'false') THEN 'boolean'
        ELSE 'string'
      END,
      'user_input'
    );
  END LOOP;

  -- PASO 3: Crear evento inicial
  INSERT INTO lot_events (
    lot_id,
    event_type,
    event_category,
    actor_id,
    location,
    description
  ) VALUES (
    v_lot_id,
    'lot.created',
    'lifecycle',
    p_producer_id,
    p_origin_location,
    'Lote registrado en el sistema'
  );

  -- PASO 4: Crear trust_state inicial
  INSERT INTO trust_states (
    lot_id,
    trust_score,
    verification_count,
    evidence_count
  ) VALUES (
    v_lot_id,
    10.00,  -- Score base por creación
    0,
    0
  );

  -- Retornar IDs
  RETURN QUERY
  SELECT v_lot_id, p_lot_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Qué NO Debe Seguir Ocurriendo

### ❌ ELIMINAR: localStorage

```typescript
// ANTES (MAL)
localStorage.setItem("lotes", JSON.stringify([...lotes, newLote]));

// DESPUÉS (BIEN)
// No hay localStorage, solo DB
```

### ❌ ELIMINAR: Persistencia dual

```typescript
// ANTES (MAL)
await saveBatchToDatabase(batchData);  // Supabase
localStorage.setItem("lotes", ...);     // localStorage también

// DESPUÉS (BIEN)
await lotService.createLot(payload);   // Solo Supabase
```

### ❌ ELIMINAR: Hash UUID fake

```typescript
// ANTES (MAL)
const refId = crypto.randomUUID();
transaction_hash: refId,  // No es blockchain

// DESPUÉS (BIEN)
// No hay transaction_hash en lots
// Se preparará anchor_jobs para Stage 2
```

### ❌ ELIMINAR: Metadata caótico

```typescript
// ANTES (MAL)
metadata: {
  varietyId: formData.variedad,
  timestamp: new Date().toISOString(),
  network: "MangoChain Registry",  // ← Inventado
  emoji: varietyInfo.emoji,         // ← Dato de UI
}

// DESPUÉS (BIEN)
// Metadata solo para datos técnicos del sistema
metadata: {
  client_version: "1.0.0",
  user_agent: navigator.userAgent
}
// varietyId va a lot_attributes
// emoji no se guarda (es dato de presentación)
```

### ❌ ELIMINAR: Tabla monolítica batches

```typescript
// ANTES (MAL)
INSERT INTO batches (
  batch_id, producer_name, location, variety, quality,
  total_kg, price_per_kg, is_listed, wallet_address, ...
)

// DESPUÉS (BIEN)
INSERT INTO lots (lot_id, producer_id, origin_location)
INSERT INTO lot_attributes (variety, quality, total_kg, ...)
INSERT INTO lot_events (lot.created)
INSERT INTO trust_states (score inicial)
```

---

## 8. Pseudocódigo de Implementación

### Paso 1: Crear migration de schema

```bash
# Crear archivo de migración
supabase migration new create_core_schema_v2
```

```sql
-- supabase/migrations/XXXXXX_create_core_schema_v2.sql

-- 1. Crear tabla lots
CREATE TABLE lots (...);

-- 2. Crear tabla lot_attributes
CREATE TABLE lot_attributes (...);

-- 3. Crear tabla lot_events
CREATE TABLE lot_events (...);

-- 4. Crear tabla trust_states
CREATE TABLE trust_states (...);

-- 5. Crear función RPC
CREATE OR REPLACE FUNCTION create_lot_complete(...);

-- 6. Crear políticas RLS
CREATE POLICY ...;
```

### Paso 2: Crear lotService.ts

```typescript
// src/services/lotService.ts
export const lotService = {
  createLot,
  getLotByLotId,
  updateLotAttribute,
  // ... más funciones
};
```

### Paso 3: Refactorizar Registrar.tsx

```typescript
// src/pages/Registrar.tsx

// ELIMINAR:
// - import { saveBatchToDatabase } from "@/services/batchService";
// - const refId = crypto.randomUUID();
// - localStorage.setItem(...)

// AGREGAR:
import { lotService } from "@/services/lotService";

const handleSubmit = async (e) => {
  const payload = { ... };
  const result = await lotService.createLot(payload);
  // ...
};
```

### Paso 4: Migrar datos existentes (opcional)

```sql
-- Script de migración de batches → lots
INSERT INTO lots (lot_id, producer_id, origin_location, created_at)
SELECT batch_id, producer_id, location, created_at
FROM batches;

INSERT INTO lot_attributes (lot_id, attribute_key, attribute_value)
SELECT
  l.id,
  'variety',
  b.variety
FROM batches b
JOIN lots l ON b.batch_id = l.lot_id;

-- ... más atributos
```

### Paso 5: Deprecar batchService.ts

```typescript
// src/services/batchService.ts

/**
 * @deprecated Use lotService instead
 * Este servicio se mantendrá solo para compatibilidad temporal
 */
export const saveBatchToDatabase = async (batchData: BatchRecord) => {
  console.warn("saveBatchToDatabase is deprecated. Use lotService.createLot()");
  // ... implementación legacy
};
```

---

## 9. Checklist de Implementación

### Schema (Workstream A)
- [ ] Crear migration `create_core_schema_v2.sql`
- [ ] Crear tabla `lots`
- [ ] Crear tabla `lot_attributes`
- [ ] Crear tabla `lot_events`
- [ ] Crear tabla `trust_states`
- [ ] Crear función RPC `create_lot_complete()`
- [ ] Crear políticas RLS
- [ ] Ejecutar migration en dev
- [ ] Validar con datos de prueba

### Servicios (Workstream C)
- [ ] Crear `src/services/lotService.ts`
- [ ] Implementar `createLot()`
- [ ] Implementar `getLotByLotId()`
- [ ] Implementar validaciones
- [ ] Agregar tests unitarios
- [ ] Deprecar `batchService.ts`

### Componente (Workstream D)
- [ ] Refactorizar `Registrar.tsx`
- [ ] Eliminar imports de `batchService`
- [ ] Eliminar localStorage
- [ ] Eliminar hash UUID fake
- [ ] Agregar import de `lotService`
- [ ] Actualizar handleSubmit
- [ ] Probar flujo completo

### Limpieza
- [ ] Eliminar DEMO_BATCHES
- [ ] Eliminar DEMO_DATA
- [ ] Eliminar localStorage fallbacks
- [ ] Actualizar tipos TypeScript
- [ ] Actualizar documentación

---

## 10. Criterios de Éxito

### Funcional
✅ Al registrar un lote:
- Se crea 1 row en `lots`
- Se crean N rows en `lot_attributes`
- Se crea 1 row en `lot_events` (lot.created)
- Se crea 1 row en `trust_states`
- Todo en una transacción atómica

✅ Si falla algún paso:
- Se hace ROLLBACK completo
- No quedan datos huérfanos
- Usuario recibe mensaje de error claro

### No Funcional
✅ Performance:
- Registro completo en < 500ms
- Sin queries N+1

✅ Mantenibilidad:
- Componente < 300 líneas
- Servicio con funciones < 50 líneas
- Separación clara de responsabilidades

✅ Calidad:
- Sin localStorage
- Sin datos hardcoded
- Sin persistencia dual
- Sin lógica de negocio en UI

---

## 11. Próximos Pasos

Después de completar Registrar:

1. **Rastrear** - Leer de nuevas tablas, construir timeline desde lot_events
2. **Verify** - Crear qr_verifications, actualizar trust_states
3. **Dashboard** - Leer de vistas materializadas, eliminar agregaciones en UI

---

**Fin del Workstream: Refactorización de Registrar**
