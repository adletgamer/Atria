# Core Schema Design - Stage 1

**Fecha de diseño:** 26 de marzo, 2026  
**Objetivo:** Definir el modelo final del dominio base para la plataforma de trazabilidad de mangos

---

## Resumen Ejecutivo

Este documento define el **esquema core** que servirá como fundación para toda la plataforma. El diseño prioriza:

1. **Integridad referencial** - Todas las relaciones con FKs explícitas
2. **Trazabilidad completa** - Eventos inmutables de cadena de suministro
3. **Extensibilidad** - Metadata JSONB para campos variables
4. **Performance** - Índices estratégicos en campos de búsqueda
5. **Auditoría** - Timestamps y logs de cambios

---

## Principios de Diseño

### 1. Separación de Concerns
- **Entidades de dominio** (batches, profiles) separadas de **eventos** (supply_chain_events)
- **Datos transaccionales** (orders) separados de **datos maestros** (batches)
- **Auditoría** (audit_log) separada de datos operacionales

### 2. Inmutabilidad donde importa
- `supply_chain_events` es append-only (no UPDATE/DELETE)
- `qr_verifications` es append-only
- `audit_log` es append-only

### 3. Flexibilidad controlada
- Campos `metadata JSONB` para extensiones sin migrations
- Enums para valores controlados (`app_role`, `batch_status`, `event_type`)
- Campos opcionales claramente marcados

---

## Entidades Mínimas

### Diagrama de Relaciones

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│    profiles     │
│─────────────────│
│ id (PK)         │◄────────┐
│ full_name       │         │
│ role (enum)     │         │
│ company_name    │         │
│ location        │         │
│ phone           │         │
└─────────────────┘         │
         │                  │
         │ 1:N              │
         ▼                  │
┌─────────────────┐         │
│    batches      │         │
│─────────────────│         │
│ id (PK)         │         │
│ batch_id (UK)   │         │ N:1
│ producer_id (FK)├─────────┘
│ producer_name   │
│ location        │
│ variety         │
│ quality         │
│ status (enum)   │
│ total_kg        │
│ price_per_kg    │
│ is_listed       │
│ wallet_address  │
│ tx_hash         │
│ metadata        │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌──────────────────────┐
│ supply_chain_events  │
│──────────────────────│
│ id (PK)              │
│ batch_id (FK)        │
│ event_type (enum)    │
│ location             │
│ actor_id (FK)        │
│ description          │
│ metadata             │
│ occurred_at          │
└──────────────────────┘

         │ 1:N
         ▼
┌──────────────────────┐
│  qr_verifications    │
│──────────────────────│
│ id (PK)              │
│ batch_id (FK)        │
│ verified_at          │
│ device_fingerprint   │
│ location_data        │
│ ip_address           │
│ user_agent           │
└──────────────────────┘

         │ 1:N
         ▼
┌──────────────────────┐
│      orders          │
│──────────────────────│
│ id (PK)              │
│ batch_id (FK)        │
│ buyer_id (FK)        │
│ seller_id (FK)       │
│ quantity_kg          │
│ price_per_kg         │
│ total_price          │
│ status (enum)        │
│ notes                │
└──────────────────────┘
```

---

## Tabla 1: profiles

### Propósito
Extiende `auth.users` de Supabase con información específica del dominio de negocio.

### Esquema
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  role app_role NOT NULL DEFAULT 'agricultor',
  company_name VARCHAR(255),
  location VARCHAR(255),
  phone VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE app_role AS ENUM ('agricultor', 'exportador', 'distribuidor', 'comprador');
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID | ✅ | FK a auth.users, PK |
| `full_name` | VARCHAR(255) | ❌ | Nombre completo del usuario |
| `role` | app_role | ✅ | Rol en la plataforma |
| `company_name` | VARCHAR(255) | ❌ | Nombre de empresa (exportadores) |
| `location` | VARCHAR(255) | ❌ | Ubicación principal |
| `phone` | VARCHAR(50) | ❌ | Teléfono de contacto |
| `bio` | TEXT | ❌ | Descripción/biografía |
| `avatar_url` | TEXT | ❌ | URL de foto de perfil |
| `created_at` | TIMESTAMPTZ | ✅ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | ✅ | Última actualización |

### Índices
```sql
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_location ON profiles(location);
```

### Justificación
- **Existe en esta etapa:** Necesario para vincular batches con productores
- **Rol:** Permite permisos diferenciados (agricultor registra, exportador compra)
- **Extensible:** Campos opcionales permiten perfiles completos o mínimos

### RLS (Row Level Security)
```sql
-- Los usuarios pueden ver todos los perfiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## Tabla 2: batches

### Propósito
Entidad central del dominio. Representa un lote de mangos registrado en la plataforma.

### Esquema
```sql
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(100) UNIQUE NOT NULL,
  producer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  producer_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  variety VARCHAR(100) NOT NULL,
  quality VARCHAR(50) NOT NULL,
  status batch_status NOT NULL DEFAULT 'registered',
  total_kg NUMERIC(10, 2),
  price_per_kg NUMERIC(10, 2),
  is_listed BOOLEAN NOT NULL DEFAULT false,
  wallet_address VARCHAR(255),
  transaction_hash VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE batch_status AS ENUM (
  'registered',
  'in_transit',
  'exported',
  'in_distribution',
  'delivered',
  'cancelled'
);
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID | ✅ | PK interno |
| `batch_id` | VARCHAR(100) | ✅ | ID único legible (ej: MG-2025-001) |
| `producer_id` | UUID | ❌ | FK a profiles (puede ser NULL si usuario se elimina) |
| `producer_name` | VARCHAR(255) | ✅ | Nombre del productor (desnormalizado para histórico) |
| `location` | VARCHAR(255) | ✅ | Ubicación de origen |
| `variety` | VARCHAR(100) | ✅ | Variedad de mango |
| `quality` | VARCHAR(50) | ✅ | Grado de calidad |
| `status` | batch_status | ✅ | Estado actual en cadena de suministro |
| `total_kg` | NUMERIC(10,2) | ❌ | Peso total del lote |
| `price_per_kg` | NUMERIC(10,2) | ❌ | Precio por kilogramo (USD) |
| `is_listed` | BOOLEAN | ✅ | Visible en marketplace |
| `wallet_address` | VARCHAR(255) | ❌ | Dirección de wallet del registrador |
| `transaction_hash` | VARCHAR(255) | ❌ | Hash de transacción blockchain |
| `metadata` | JSONB | ❌ | Datos adicionales (varietyId, emoji, etc.) |
| `created_at` | TIMESTAMPTZ | ✅ | Fecha de registro |
| `updated_at` | TIMESTAMPTZ | ✅ | Última actualización |

### Índices
```sql
CREATE UNIQUE INDEX idx_batches_batch_id ON batches(batch_id);
CREATE INDEX idx_batches_producer_id ON batches(producer_id);
CREATE INDEX idx_batches_location ON batches(location);
CREATE INDEX idx_batches_variety ON batches(variety);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_is_listed ON batches(is_listed) WHERE is_listed = true;
CREATE INDEX idx_batches_created_at ON batches(created_at DESC);
CREATE INDEX idx_batches_wallet_address ON batches(wallet_address);
```

### Constraints
```sql
ALTER TABLE batches ADD CONSTRAINT check_batch_id_format
  CHECK (batch_id ~ '^[A-Z]{2,4}-\d{4}-\d{3,6}$');

ALTER TABLE batches ADD CONSTRAINT check_positive_kg
  CHECK (total_kg IS NULL OR total_kg > 0);

ALTER TABLE batches ADD CONSTRAINT check_positive_price
  CHECK (price_per_kg IS NULL OR price_per_kg > 0);
```

### Justificación
- **batch_id separado de id:** ID legible para usuarios, UUID para sistema
- **producer_name desnormalizado:** Mantiene histórico aunque se elimine el profile
- **status enum:** Valores controlados, fácil de extender
- **metadata JSONB:** Flexibilidad sin migrations (varietyId, emoji, certificaciones)
- **is_listed:** Separación clara entre inventario y marketplace

### RLS
```sql
-- Todos pueden ver batches
CREATE POLICY "Batches are viewable by everyone"
  ON batches FOR SELECT
  USING (true);

-- Solo el productor puede crear batches
CREATE POLICY "Authenticated users can create batches"
  ON batches FOR INSERT
  WITH CHECK (auth.uid() = producer_id);

-- Solo el productor puede actualizar su batch
CREATE POLICY "Producers can update own batches"
  ON batches FOR UPDATE
  USING (auth.uid() = producer_id);
```

---

## Tabla 3: supply_chain_events

### Propósito
Registro inmutable de eventos en la cadena de suministro. Permite reconstruir timeline completo.

### Esquema
```sql
CREATE TABLE supply_chain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(100) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  location VARCHAR(255),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE event_type AS ENUM (
  'registered',
  'quality_check',
  'packaged',
  'shipped',
  'in_transit',
  'customs_cleared',
  'arrived_warehouse',
  'delivered',
  'cancelled'
);
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID | ✅ | PK |
| `batch_id` | VARCHAR(100) | ✅ | FK a batches.batch_id |
| `event_type` | event_type | ✅ | Tipo de evento |
| `location` | VARCHAR(255) | ❌ | Ubicación donde ocurrió |
| `actor_id` | UUID | ❌ | Quién realizó la acción |
| `description` | TEXT | ❌ | Descripción del evento |
| `metadata` | JSONB | ❌ | Datos adicionales (temperatura, fotos, etc.) |
| `occurred_at` | TIMESTAMPTZ | ✅ | Cuándo ocurrió el evento |
| `created_at` | TIMESTAMPTZ | ✅ | Cuándo se registró |

### Índices
```sql
CREATE INDEX idx_events_batch_id ON supply_chain_events(batch_id);
CREATE INDEX idx_events_event_type ON supply_chain_events(event_type);
CREATE INDEX idx_events_occurred_at ON supply_chain_events(occurred_at DESC);
CREATE INDEX idx_events_actor_id ON supply_chain_events(actor_id);
```

### Justificación
- **Append-only:** No se permite UPDATE/DELETE, solo INSERT
- **occurred_at vs created_at:** Permite registrar eventos pasados
- **event_type enum:** Vocabulario controlado, extensible
- **metadata:** Flexibilidad para datos específicos (temperatura, certificados, fotos)
- **Referencia a batch_id (string):** Más legible en logs que UUID

### RLS
```sql
-- Todos pueden ver eventos
CREATE POLICY "Events are viewable by everyone"
  ON supply_chain_events FOR SELECT
  USING (true);

-- Solo usuarios autenticados pueden crear eventos
CREATE POLICY "Authenticated users can create events"
  ON supply_chain_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- NO UPDATE/DELETE policies (append-only)
```

### Trigger para actualizar batch.status
```sql
CREATE OR REPLACE FUNCTION update_batch_status_from_event()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE batches
  SET status = NEW.event_type::batch_status,
      updated_at = NOW()
  WHERE batch_id = NEW.batch_id
    AND NEW.event_type::text IN ('registered', 'in_transit', 'exported', 'delivered', 'cancelled');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_batch_status
  AFTER INSERT ON supply_chain_events
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_status_from_event();
```

---

## Tabla 4: qr_verifications

### Propósito
Registro de escaneos de códigos QR. Analytics y detección de fraude.

### Esquema
```sql
CREATE TABLE qr_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(100) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_fingerprint VARCHAR(255),
  location_data JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB
);
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID | ✅ | PK |
| `batch_id` | VARCHAR(100) | ✅ | FK a batches.batch_id |
| `verified_at` | TIMESTAMPTZ | ✅ | Timestamp del escaneo |
| `device_fingerprint` | VARCHAR(255) | ❌ | Hash del dispositivo |
| `location_data` | JSONB | ❌ | Geolocalización (lat, lng, accuracy) |
| `ip_address` | INET | ❌ | IP del escaneador |
| `user_agent` | TEXT | ❌ | User agent del navegador |
| `success` | BOOLEAN | ✅ | Si el escaneo fue exitoso |
| `metadata` | JSONB | ❌ | Datos adicionales |

### Índices
```sql
CREATE INDEX idx_qr_batch_id ON qr_verifications(batch_id);
CREATE INDEX idx_qr_verified_at ON qr_verifications(verified_at DESC);
CREATE INDEX idx_qr_device ON qr_verifications(device_fingerprint);
CREATE INDEX idx_qr_success ON qr_verifications(success);
```

### Justificación
- **Append-only:** Histórico completo de escaneos
- **device_fingerprint:** Detectar múltiples escaneos del mismo dispositivo
- **location_data JSONB:** Flexibilidad para diferentes formatos de geolocalización
- **ip_address INET:** Tipo nativo de PostgreSQL para IPs
- **success:** Permite registrar intentos fallidos

### RLS
```sql
-- Solo el productor del batch puede ver sus verificaciones
CREATE POLICY "Producers can view own batch verifications"
  ON qr_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.batch_id = qr_verifications.batch_id
        AND batches.producer_id = auth.uid()
    )
  );

-- Cualquiera puede insertar (escaneo público)
CREATE POLICY "Anyone can create verifications"
  ON qr_verifications FOR INSERT
  WITH CHECK (true);
```

---

## Tabla 5: orders

### Propósito
Transacciones de compra/venta en el marketplace.

### Esquema
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  quantity_kg NUMERIC(10, 2) NOT NULL,
  price_per_kg NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID | ✅ | PK |
| `batch_id` | UUID | ✅ | FK a batches.id |
| `buyer_id` | UUID | ✅ | FK a profiles.id |
| `seller_id` | UUID | ✅ | FK a profiles.id |
| `quantity_kg` | NUMERIC(10,2) | ✅ | Cantidad ordenada |
| `price_per_kg` | NUMERIC(10,2) | ✅ | Precio acordado por kg |
| `total_price` | NUMERIC(12,2) | ✅ | Precio total calculado |
| `status` | order_status | ✅ | Estado de la orden |
| `notes` | TEXT | ❌ | Notas adicionales |
| `created_at` | TIMESTAMPTZ | ✅ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | ✅ | Última actualización |

### Índices
```sql
CREATE INDEX idx_orders_batch_id ON orders(batch_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### Constraints
```sql
ALTER TABLE orders ADD CONSTRAINT check_positive_quantity
  CHECK (quantity_kg > 0);

ALTER TABLE orders ADD CONSTRAINT check_positive_price
  CHECK (price_per_kg > 0 AND total_price > 0);

ALTER TABLE orders ADD CONSTRAINT check_different_parties
  CHECK (buyer_id != seller_id);
```

### Justificación
- **batch_id UUID:** Referencia interna (más eficiente que string)
- **seller_id explícito:** Puede diferir del producer_id si hay intermediarios
- **total_price calculado:** Evita inconsistencias
- **status enum:** Workflow claro de orden
- **ON DELETE RESTRICT:** No permitir borrar batches/usuarios con órdenes activas

### RLS
```sql
-- Compradores y vendedores pueden ver sus órdenes
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() IN (buyer_id, seller_id));

-- Solo compradores pueden crear órdenes
CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Compradores y vendedores pueden actualizar
CREATE POLICY "Parties can update orders"
  ON orders FOR UPDATE
  USING (auth.uid() IN (buyer_id, seller_id));
```

---

## Tabla 6: audit_log (Auditoría General)

### Propósito
Registro de cambios críticos en el sistema. Compliance y debugging.

### Esquema
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID | ✅ | PK |
| `table_name` | VARCHAR(100) | ✅ | Tabla afectada |
| `record_id` | UUID | ✅ | ID del registro afectado |
| `action` | VARCHAR(50) | ✅ | INSERT/UPDATE/DELETE |
| `actor_id` | UUID | ❌ | Quién hizo el cambio |
| `old_values` | JSONB | ❌ | Valores antes del cambio |
| `new_values` | JSONB | ❌ | Valores después del cambio |
| `ip_address` | INET | ❌ | IP del actor |
| `user_agent` | TEXT | ❌ | User agent |
| `created_at` | TIMESTAMPTZ | ✅ | Timestamp |

### Índices
```sql
CREATE INDEX idx_audit_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_record_id ON audit_log(record_id);
CREATE INDEX idx_audit_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action);
```

### Justificación
- **Genérico:** Puede auditar cualquier tabla
- **old_values/new_values JSONB:** Almacena diff completo
- **Append-only:** No se permite modificar logs
- **actor_id nullable:** Puede ser acción del sistema

### Trigger automático
```sql
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, record_id, action, actor_id, old_values)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', auth.uid(), row_to_json(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (table_name, record_id, action, actor_id, old_values, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', auth.uid(), row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, record_id, action, actor_id, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', auth.uid(), row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a tablas críticas
CREATE TRIGGER audit_batches
  AFTER INSERT OR UPDATE OR DELETE ON batches
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

---

## Relaciones y Claves Foráneas

### Resumen de FKs

| Tabla | Campo | Referencia | On Delete |
|-------|-------|------------|-----------|
| profiles | id | auth.users(id) | CASCADE |
| batches | producer_id | profiles(id) | SET NULL |
| supply_chain_events | batch_id | batches(batch_id) | CASCADE |
| supply_chain_events | actor_id | profiles(id) | SET NULL |
| qr_verifications | batch_id | batches(batch_id) | CASCADE |
| orders | batch_id | batches(id) | RESTRICT |
| orders | buyer_id | profiles(id) | RESTRICT |
| orders | seller_id | profiles(id) | RESTRICT |
| audit_log | actor_id | profiles(id) | SET NULL |

### Justificación de ON DELETE

- **CASCADE:** Cuando el padre se elimina, los hijos también (events, verifications)
- **SET NULL:** Mantener histórico aunque se elimine el actor (producer_id, actor_id)
- **RESTRICT:** No permitir eliminación si hay dependencias activas (orders)

---

## Enums Definidos

### 1. app_role
```sql
CREATE TYPE app_role AS ENUM (
  'agricultor',
  'exportador',
  'distribuidor',
  'comprador'
);
```
**Uso:** Roles de usuarios en la plataforma

### 2. batch_status
```sql
CREATE TYPE batch_status AS ENUM (
  'registered',
  'in_transit',
  'exported',
  'in_distribution',
  'delivered',
  'cancelled'
);
```
**Uso:** Estado actual del lote en la cadena de suministro

### 3. event_type
```sql
CREATE TYPE event_type AS ENUM (
  'registered',
  'quality_check',
  'packaged',
  'shipped',
  'in_transit',
  'customs_cleared',
  'arrived_warehouse',
  'delivered',
  'cancelled'
);
```
**Uso:** Tipos de eventos en supply_chain_events

### 4. order_status
```sql
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);
```
**Uso:** Estados de órdenes en marketplace

---

## Campos Obligatorios vs Opcionales

### Obligatorios YA (Stage 1)

**batches:**
- ✅ batch_id, producer_name, location, variety, quality, status, is_listed

**profiles:**
- ✅ id, role

**supply_chain_events:**
- ✅ batch_id, event_type, occurred_at

**qr_verifications:**
- ✅ batch_id, verified_at, success

**orders:**
- ✅ batch_id, buyer_id, seller_id, quantity_kg, price_per_kg, total_price, status

### Opcionales AHORA, Obligatorios LUEGO (Stage 2+)

**batches:**
- ⏳ total_kg (cuando se integre peso real)
- ⏳ price_per_kg (cuando marketplace esté activo)
- ⏳ transaction_hash (cuando blockchain esté integrado)
- ⏳ wallet_address (cuando blockchain esté integrado)

**profiles:**
- ⏳ full_name (cuando se requiera KYC)
- ⏳ phone (cuando se active comunicación)

**supply_chain_events:**
- ⏳ location (cuando se integre GPS)
- ⏳ actor_id (cuando se requiera trazabilidad de actores)

---

## Tablas Funcionales vs Semilla

### Tablas Funcionales (Operacionales)

Estas tablas contienen datos transaccionales que cambian frecuentemente:

1. **batches** - Lotes registrados (INSERT frecuente, UPDATE ocasional)
2. **supply_chain_events** - Eventos (INSERT frecuente, append-only)
3. **qr_verifications** - Escaneos (INSERT muy frecuente, append-only)
4. **orders** - Órdenes (INSERT/UPDATE frecuente)
5. **audit_log** - Logs (INSERT automático, append-only)

### Tablas Semilla (Maestros)

Estas tablas contienen datos de referencia que cambian raramente:

1. **profiles** - Usuarios (INSERT en signup, UPDATE ocasional)

### Tablas de Configuración (Futuro)

Estas se agregarán en Stage 2+:

- **varieties** - Catálogo de variedades de mango
- **locations** - Catálogo de regiones productoras
- **quality_grades** - Definiciones de grados de calidad
- **certifications** - Tipos de certificaciones

---

## Vistas Materializadas (Performance)

### 1. batch_statistics
```sql
CREATE MATERIALIZED VIEW batch_statistics AS
SELECT
  COUNT(*) as total_batches,
  COUNT(DISTINCT producer_id) as total_producers,
  COUNT(DISTINCT location) as total_locations,
  SUM(total_kg) as total_kg,
  AVG(price_per_kg) as avg_price_per_kg,
  COUNT(*) FILTER (WHERE is_listed = true) as listed_batches
FROM batches
WHERE status != 'cancelled';

CREATE UNIQUE INDEX idx_batch_stats ON batch_statistics((1));
```

### 2. batch_verification_counts
```sql
CREATE MATERIALIZED VIEW batch_verification_counts AS
SELECT
  b.batch_id,
  b.producer_name,
  b.variety,
  b.location,
  COUNT(qr.id) as verification_count,
  MAX(qr.verified_at) as last_verified_at
FROM batches b
LEFT JOIN qr_verifications qr ON b.batch_id = qr.batch_id
GROUP BY b.batch_id, b.producer_name, b.variety, b.location;

CREATE UNIQUE INDEX idx_batch_verif_counts ON batch_verification_counts(batch_id);
```

### 3. producer_metrics
```sql
CREATE MATERIALIZED VIEW producer_metrics AS
SELECT
  p.id as producer_id,
  p.full_name,
  COUNT(b.id) as total_batches,
  SUM(b.total_kg) as total_kg_produced,
  AVG(b.price_per_kg) as avg_price,
  COUNT(o.id) as total_orders,
  SUM(o.total_price) as total_revenue
FROM profiles p
LEFT JOIN batches b ON p.id = b.producer_id
LEFT JOIN orders o ON b.id = o.batch_id AND o.seller_id = p.id
WHERE p.role = 'agricultor'
GROUP BY p.id, p.full_name;

CREATE UNIQUE INDEX idx_producer_metrics ON producer_metrics(producer_id);
```

### Refresh Strategy
```sql
-- Refrescar cada hora
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('refresh-batch-stats', '0 * * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY batch_statistics');
SELECT cron.schedule('refresh-verification-counts', '0 * * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY batch_verification_counts');
SELECT cron.schedule('refresh-producer-metrics', '0 */6 * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY producer_metrics');
```

---

## Funciones Útiles

### 1. Obtener timeline de un batch
```sql
CREATE OR REPLACE FUNCTION get_batch_timeline(p_batch_id VARCHAR)
RETURNS TABLE (
  event_type event_type,
  description TEXT,
  location VARCHAR,
  actor_name VARCHAR,
  occurred_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.event_type,
    e.description,
    e.location,
    p.full_name as actor_name,
    e.occurred_at
  FROM supply_chain_events e
  LEFT JOIN profiles p ON e.actor_id = p.id
  WHERE e.batch_id = p_batch_id
  ORDER BY e.occurred_at ASC;
END;
$$ LANGUAGE plpgsql;
```

### 2. Validar disponibilidad de batch para orden
```sql
CREATE OR REPLACE FUNCTION check_batch_availability(
  p_batch_id UUID,
  p_requested_kg NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
  v_total_kg NUMERIC;
  v_ordered_kg NUMERIC;
  v_available_kg NUMERIC;
BEGIN
  -- Obtener kg totales del batch
  SELECT total_kg INTO v_total_kg
  FROM batches
  WHERE id = p_batch_id AND is_listed = true;

  IF v_total_kg IS NULL THEN
    RETURN false;
  END IF;

  -- Calcular kg ya ordenados
  SELECT COALESCE(SUM(quantity_kg), 0) INTO v_ordered_kg
  FROM orders
  WHERE batch_id = p_batch_id
    AND status NOT IN ('cancelled', 'refunded');

  v_available_kg := v_total_kg - v_ordered_kg;

  RETURN v_available_kg >= p_requested_kg;
END;
$$ LANGUAGE plpgsql;
```

### 3. Calcular precio total de orden
```sql
CREATE OR REPLACE FUNCTION calculate_order_total(
  p_quantity_kg NUMERIC,
  p_price_per_kg NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(p_quantity_kg * p_price_per_kg, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Triggers Automáticos

### 1. Auto-actualizar updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Validar formato de batch_id
```sql
CREATE OR REPLACE FUNCTION validate_batch_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_id !~ '^[A-Z]{2,4}-\d{4}-\d{3,6}$' THEN
    RAISE EXCEPTION 'Invalid batch_id format. Expected: XX-YYYY-NNN';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_batch_id_format
  BEFORE INSERT OR UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION validate_batch_id();
```

### 3. Crear evento inicial al registrar batch
```sql
CREATE OR REPLACE FUNCTION create_initial_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO supply_chain_events (
    batch_id,
    event_type,
    location,
    actor_id,
    description
  ) VALUES (
    NEW.batch_id,
    'registered',
    NEW.location,
    NEW.producer_id,
    'Batch registered in system'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_event
  AFTER INSERT ON batches
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_event();
```

---

## Migración desde Estado Actual

### Paso 1: Crear nuevas tablas
```sql
-- Ejecutar todos los CREATE TABLE de este documento
-- Ejecutar todos los CREATE TYPE (enums)
-- Ejecutar todos los CREATE INDEX
```

### Paso 2: Migrar datos existentes
```sql
-- Los batches actuales ya están en formato correcto
-- Solo necesitan:
UPDATE batches SET status = 'registered' WHERE status IS NULL;
UPDATE batches SET is_listed = false WHERE is_listed IS NULL;
```

### Paso 3: Crear eventos iniciales para batches existentes
```sql
INSERT INTO supply_chain_events (batch_id, event_type, location, occurred_at)
SELECT
  batch_id,
  'registered'::event_type,
  location,
  created_at
FROM batches
WHERE NOT EXISTS (
  SELECT 1 FROM supply_chain_events e
  WHERE e.batch_id = batches.batch_id
);
```

### Paso 4: Migrar datos de localStorage a DB
```javascript
// En el frontend, ejecutar una vez:
const scans = JSON.parse(localStorage.getItem('mango_scan_tracking') || '[]');
for (const scan of scans) {
  await supabase.from('qr_verifications').insert({
    batch_id: scan.batchId,
    verified_at: scan.timestamp,
    success: scan.success
  });
}
localStorage.removeItem('mango_scan_tracking');
```

---

## Definition of Done - Checklist

### Diseño ✅
- [x] Definir entidades mínimas (6 tablas core)
- [x] Definir relaciones y FKs
- [x] Definir enums (4 tipos)
- [x] Definir campos obligatorios vs opcionales
- [x] Definir tablas funcionales vs semilla
- [x] Justificar cada tabla

### Documentación ✅
- [x] Explicar propósito de cada tabla
- [x] Documentar todos los campos
- [x] Documentar índices y constraints
- [x] Documentar políticas RLS
- [x] Documentar triggers y funciones

### Validación ✅
- [x] El dominio se puede explicar sin mirar código frontend
- [x] Todas las relaciones tienen sentido de negocio
- [x] Campos opcionales tienen justificación
- [x] Enums cubren todos los casos de uso actuales

---

## Próximos Pasos (Stage 2)

1. **Implementar schema en Supabase**
   - Crear migration SQL
   - Ejecutar en ambiente de desarrollo
   - Validar con datos de prueba

2. **Actualizar servicios frontend**
   - Migrar `batchService.ts` para usar nuevas tablas
   - Crear `eventService.ts` para supply_chain_events
   - Crear `verificationService.ts` para qr_verifications

3. **Eliminar código legacy**
   - Remover DEMO_BATCHES, DEMO_DATA
   - Remover localStorage fallbacks
   - Remover timeline hardcoded

4. **Agregar tablas de configuración**
   - varieties (catálogo)
   - locations (catálogo)
   - quality_grades (definiciones)

---

**Fin del Core Schema Design - Stage 1**
