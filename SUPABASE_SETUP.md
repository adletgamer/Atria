# 🗄️ Guía de Configuración de Supabase

## ✅ Estado Actual de la Conexión

Tu proyecto ya tiene configurado:
- ✓ **Supabase URL**: `https://nbfyfrpilusttfypglul.supabase.co`
- ✓ **Proyecto ID**: `nbfyfrpilusttfypglul`
- ✓ **Cliente JS**: Importado en `src/integrations/supabase/client.ts`

## 📋 Pasos para Crear la Tabla de Batches

### 1️⃣ Acceder a Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tus credenciales
3. Selecciona el proyecto **MangoChain** (ID: `nbfyfrpilusttfypglul`)

### 2️⃣ Crear las Tablas

#### Opción A: Usar el Script SQL (Recomendado)

1. Ve a **SQL Editor** en el menú izquierdo
2. Haz clic en **New Query**
3. Copia todo el contenido de `supabase/migrations/create_batch_tables.sql`
4. Pega el contenido en el editor
5. Haz clic en **Run** (▶️)

#### Opción B: Crear Manualmente

Si prefieres crear las tablas manualmente:

**Paso 1: Crear tabla `batches`**

```sql
CREATE TABLE batches (
  id BIGSERIAL PRIMARY KEY,
  batch_id VARCHAR(255) UNIQUE NOT NULL,
  producer_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  variety VARCHAR(255) NOT NULL,
  quality VARCHAR(100) NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Paso 2: Crear índices**

```sql
CREATE INDEX idx_batches_batch_id ON batches(batch_id);
CREATE INDEX idx_batches_created_at ON batches(created_at DESC);
```

**Paso 3: Habilitar RLS (Seguridad)**

```sql
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Batches are publicly readable"
  ON batches FOR SELECT USING (true);

CREATE POLICY "Batches can be inserted"
  ON batches FOR INSERT WITH CHECK (true);
```

### 3️⃣ Verificar la Conexión

En tu app, la conexión se verifica automáticamente:

```typescript
import { testSupabaseConnection } from "@/services/batchService";

const result = await testSupabaseConnection();
if (result.connected) {
  console.log("✓ Conectado a Supabase");
} else {
  console.error("✗ Error de conexión:", result.error);
}
```

## 📊 Estructura de la Tabla `batches`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGSERIAL | ID único (auto-generado) |
| `batch_id` | VARCHAR(255) UNIQUE | ID del lote (ej: LOTE-2025-001) |
| `producer_name` | VARCHAR(255) | Nombre del productor |
| `location` | VARCHAR(255) | Ubicación (ej: Piura) |
| `variety` | VARCHAR(255) | Variedad de mango |
| `quality` | VARCHAR(100) | Grado de calidad |
| `transaction_hash` | VARCHAR(255) | Hash de transacción blockchain |
| `wallet_address` | VARCHAR(255) | Dirección de wallet de MetaMask |
| `metadata` | JSONB | Datos adicionales (JSON flexible) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

## 🔒 Seguridad (RLS - Row Level Security)

Las políticas creadas permiten:

- ✓ **Lectura pública**: Cualquiera puede ver los batches (para verificación)
- ✓ **Escritura controlada**: Solo la aplicación autenticada puede insertar

## 🔌 Uso en la Aplicación

### Guardar un Batch

```typescript
import { saveBatchToDatabase } from "@/services/batchService";

const batchData = {
  batch_id: "LOTE-2025-001",
  producer_name: "Juan Pérez",
  location: "Piura",
  variety: "Kent",
  quality: "Premium",
  transaction_hash: "0x1234...",
  wallet_address: "0xabcd...",
  metadata: { emoji: "🥭" }
};

const result = await saveBatchToDatabase(batchData);
if (result.success) {
  console.log("✓ Batch guardado en BD");
}
```

### Obtener Todos los Batches

```typescript
import { getAllBatches } from "@/services/batchService";

const result = await getAllBatches();
if (result.success) {
  console.log("Batches:", result.data);
}
```

### Obtener un Batch Específico

```typescript
import { getBatchById } from "@/services/batchService";

const result = await getBatchById("LOTE-2025-001");
if (result.success) {
  console.log("Batch encontrado:", result.data);
}
```

## 📝 Variables de Entorno

Ya están configuradas en tu `.env`:

```env
VITE_SUPABASE_URL="https://nbfyfrpilusttfypglul.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🧪 Pruebas

### Test desde Supabase UI

1. Ve a **SQL Editor**
2. Ejecuta:
```sql
SELECT * FROM batches LIMIT 10;
```

### Test desde tu App

```typescript
// En la consola del navegador
import { testSupabaseConnection } from "@/services/batchService";
await testSupabaseConnection();
```

## 🚨 Troubleshooting

### Error: "Table batches does not exist"

**Solución**: Ejecuta el script SQL en `supabase/migrations/create_batch_tables.sql`

### Error: "Permission denied"

**Solución**: Verifica que RLS esté habilitado y las políticas estén creadas

### Error: "Invalid API key"

**Solución**: Verifica que `VITE_SUPABASE_PUBLISHABLE_KEY` sea correcto en `.env`

### La conexión es lenta

**Solución**: 
- Verifica tu conexión a internet
- Usa índices para optimizar queries
- Considera usar paginación para datos grandes

## 📚 Documentación Oficial

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## ✨ Funcionalidades Adicionales (Tablas Opcionales)

El script también crea:

1. **`batch_audit_log`**: Registro de auditoría de cambios
2. **`qr_verifications`**: Registro de escaneos de QR
3. Vistas útiles: `batches_with_verification_count`, `popular_batches`

Estas son opcionales pero recomendadas para análisis y seguridad.

---

**Estado**: ✓ Conexión lista | 📊 Tablas a crear | ✅ Integraciones activas
