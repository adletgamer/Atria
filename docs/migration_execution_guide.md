# Guía de Ejecución de Migration - Core Schema V2

**Fecha:** 27 de marzo, 2026  
**Objetivo:** Ejecutar la migration del Core Schema V2 y resolver errores de TypeScript

---

## Paso 1: Ejecutar Migration en Supabase

### Opción A: Supabase CLI (Recomendado)

```bash
# 1. Asegurarse de estar en el directorio del proyecto
cd "c:\Users\HP\Documents\Fadelk 2025\VELOCITY\MANGO TRACKER\mango-rastreo-chain"

# 2. Verificar que Supabase CLI está instalado
supabase --version

# 3. Ejecutar la migration
supabase db push

# 4. Regenerar tipos TypeScript
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Opción B: Supabase Dashboard (Manual)

1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **SQL Editor**
4. Copiar el contenido de `supabase/migrations/20260327000000_create_core_schema_v2.sql`
5. Pegar en el editor y ejecutar
6. Verificar que no hay errores

---

## Paso 2: Verificar Tablas Creadas

```sql
-- Ejecutar en SQL Editor de Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('lots', 'lot_attributes', 'lot_events', 'trust_states', 'qr_verifications')
ORDER BY table_name;
```

**Resultado esperado:**
```
table_name
-----------------
lot_attributes
lot_events
lots
qr_verifications
trust_states
```

---

## Paso 3: Verificar Funciones RPC

```sql
-- Verificar que las funciones existen
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_lot_complete', 'get_lot_timeline', 'get_lot_with_details')
ORDER BY routine_name;
```

**Resultado esperado:**
```
routine_name
--------------------
create_lot_complete
get_lot_timeline
get_lot_with_details
```

---

## Paso 4: Regenerar Tipos TypeScript

### Si usaste Supabase CLI:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### Si no tienes CLI, crear tipos manualmente:

Agregar al archivo `src/integrations/supabase/types.ts`:

```typescript
export interface Database {
  public: {
    Tables: {
      // ... tablas existentes (batches, orders, profiles, user_roles)
      
      lots: {
        Row: {
          id: string;
          lot_id: string;
          producer_id: string | null;
          origin_location: string;
          harvest_date: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lot_id: string;
          producer_id?: string | null;
          origin_location: string;
          harvest_date?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lot_id?: string;
          producer_id?: string | null;
          origin_location?: string;
          harvest_date?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lots_producer_id_fkey";
            columns: ["producer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      
      lot_attributes: {
        Row: {
          id: string;
          lot_id: string;
          attribute_key: string;
          attribute_value: string;
          value_type: string;
          source: string;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lot_id: string;
          attribute_key: string;
          attribute_value: string;
          value_type?: string;
          source?: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lot_id?: string;
          attribute_key?: string;
          attribute_value?: string;
          value_type?: string;
          source?: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lot_attributes_lot_id_fkey";
            columns: ["lot_id"];
            referencedRelation: "lots";
            referencedColumns: ["id"];
          }
        ];
      };
      
      lot_events: {
        Row: {
          id: string;
          lot_id: string;
          event_type: string;
          event_category: string;
          actor_id: string | null;
          location: string | null;
          description: string | null;
          metadata: Json;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lot_id: string;
          event_type: string;
          event_category: string;
          actor_id?: string | null;
          location?: string | null;
          description?: string | null;
          metadata?: Json;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lot_id?: string;
          event_type?: string;
          event_category?: string;
          actor_id?: string | null;
          location?: string | null;
          description?: string | null;
          metadata?: Json;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lot_events_lot_id_fkey";
            columns: ["lot_id"];
            referencedRelation: "lots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lot_events_actor_id_fkey";
            columns: ["actor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      
      trust_states: {
        Row: {
          id: string;
          lot_id: string;
          trust_score: number;
          verification_count: number;
          evidence_count: number;
          last_verified_at: string | null;
          flags: Json;
          computed_at: string;
        };
        Insert: {
          id?: string;
          lot_id: string;
          trust_score?: number;
          verification_count?: number;
          evidence_count?: number;
          last_verified_at?: string | null;
          flags?: Json;
          computed_at?: string;
        };
        Update: {
          id?: string;
          lot_id?: string;
          trust_score?: number;
          verification_count?: number;
          evidence_count?: number;
          last_verified_at?: string | null;
          flags?: Json;
          computed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trust_states_lot_id_fkey";
            columns: ["lot_id"];
            referencedRelation: "lots";
            referencedColumns: ["id"];
          }
        ];
      };
      
      qr_verifications: {
        Row: {
          id: string;
          lot_id: string;
          verified_at: string;
          device_fingerprint: string | null;
          location_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          success: boolean;
          metadata: Json;
        };
        Insert: {
          id?: string;
          lot_id: string;
          verified_at?: string;
          device_fingerprint?: string | null;
          location_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          success?: boolean;
          metadata?: Json;
        };
        Update: {
          id?: string;
          lot_id?: string;
          verified_at?: string;
          device_fingerprint?: string | null;
          location_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          success?: boolean;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "qr_verifications_lot_id_fkey";
            columns: ["lot_id"];
            referencedRelation: "lots";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    
    Functions: {
      // ... funciones existentes
      
      create_lot_complete: {
        Args: {
          p_lot_id: string;
          p_producer_id: string;
          p_origin_location: string;
          p_harvest_date: string | null;
          p_attributes: Json;
        };
        Returns: {
          lot_uuid: string;
          lot_lot_id: string;
        }[];
      };
      
      get_lot_timeline: {
        Args: {
          p_lot_id: string;
        };
        Returns: {
          event_id: string;
          event_type: string;
          event_category: string;
          description: string | null;
          location: string | null;
          actor_name: string | null;
          occurred_at: string;
        }[];
      };
      
      get_lot_with_details: {
        Args: {
          p_lot_id: string;
        };
        Returns: {
          lot_uuid: string;
          lot_id: string;
          producer_id: string | null;
          producer_name: string | null;
          origin_location: string;
          harvest_date: string | null;
          created_at: string;
          attributes: Json;
          trust_score: number;
          verification_count: number;
          last_verified_at: string | null;
        }[];
      };
    };
  };
}
```

---

## Paso 5: Probar Creación de Lote

### Test en SQL Editor:

```sql
-- Test de create_lot_complete
SELECT * FROM create_lot_complete(
  'MG-2026-TEST',
  (SELECT id FROM profiles LIMIT 1),
  'Piura',
  '2026-03-27',
  '{"variety": "Kent", "quality": "Premium", "total_kg": "500", "price_per_kg": "2.80"}'::jsonb
);

-- Verificar que se crearon todos los registros
SELECT * FROM lots WHERE lot_id = 'MG-2026-TEST';
SELECT * FROM lot_attributes WHERE lot_id = (SELECT id FROM lots WHERE lot_id = 'MG-2026-TEST');
SELECT * FROM lot_events WHERE lot_id = (SELECT id FROM lots WHERE lot_id = 'MG-2026-TEST');
SELECT * FROM trust_states WHERE lot_id = (SELECT id FROM lots WHERE lot_id = 'MG-2026-TEST');
```

---

## Paso 6: Migrar Datos Legacy (Opcional)

Si quieres migrar datos de `batches` a `lots`:

```sql
-- Migration de batches → lots
INSERT INTO lots (lot_id, producer_id, origin_location, created_at)
SELECT 
  batch_id,
  producer_id,
  location,
  created_at
FROM batches
WHERE NOT EXISTS (
  SELECT 1 FROM lots WHERE lots.lot_id = batches.batch_id
);

-- Migration de atributos
INSERT INTO lot_attributes (lot_id, attribute_key, attribute_value, value_type, source)
SELECT 
  l.id,
  'variety',
  b.variety,
  'string',
  'legacy_migration'
FROM batches b
JOIN lots l ON b.batch_id = l.lot_id
WHERE NOT EXISTS (
  SELECT 1 FROM lot_attributes 
  WHERE lot_id = l.id AND attribute_key = 'variety'
);

-- Repetir para quality, total_kg, price_per_kg, is_listed, wallet_address
```

---

## Paso 7: Verificar Errores de TypeScript Resueltos

Después de regenerar tipos, ejecutar:

```bash
npm run type-check
# o
tsc --noEmit
```

**Todos los errores de "lots", "lot_attributes", etc. deberían desaparecer.**

---

## Troubleshooting

### Error: "relation 'lots' does not exist"
- La migration no se ejecutó correctamente
- Verificar en Supabase Dashboard → Database → Tables

### Error: "function create_lot_complete does not exist"
- La función RPC no se creó
- Ejecutar solo la parte de CREATE FUNCTION del migration

### Errores de TypeScript persisten
- Regenerar tipos: `supabase gen types typescript`
- Verificar que el archivo types.ts se actualizó
- Reiniciar TypeScript server en VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"

---

## Checklist de Validación

- [ ] Migration ejecutada sin errores
- [ ] 5 tablas nuevas creadas (lots, lot_attributes, lot_events, trust_states, qr_verifications)
- [ ] 3 funciones RPC creadas (create_lot_complete, get_lot_timeline, get_lot_with_details)
- [ ] Tipos TypeScript regenerados
- [ ] Errores de lint resueltos
- [ ] Test de creación de lote exitoso
- [ ] RLS policies activas

---

**Siguiente paso:** Una vez completada la migration, proceder a refactorizar `Registrar.tsx`
