# Fase 3: Capa de Anclaje — Auditoría e Integridad en Hedera

## Resumen Ejecutivo

La Fase 3 implementa un **notariado digital** que garantiza inmutabilidad absoluta de los Evidence Packs. Una vez que una consignación es marcada como READY, su hash se ancla en la red de Hedera Hashgraph, creando una prueba criptográfica de que los datos no han sido modificados.

**Costo por anclaje: ~$0.0001 USD** (Hedera HCS message fee)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│  TrustProofCard │ AnchorTimeline │ Dashboard Stats  │
└────────┬────────────────┬────────────────┬──────────┘
         │                │                │
┌────────▼────────────────▼────────────────▼──────────┐
│               hederaService.ts                      │
│  computePackHash │ anchorEvidencePack │ verifyProof │
│  submitToHCS     │ retryPendingAnchors│ verifyByHash│
└────────┬────────────────┬────────────────┬──────────┘
         │                │                │
    ┌────▼────┐    ┌──────▼──────┐   ┌────▼────┐
    │Supabase │    │ Hedera HCS  │   │ Mirror  │
    │trust_   │    │ Topic       │   │ Node    │
    │proofs   │    │ (Testnet)   │   │ REST API│
    └─────────┘    └─────────────┘   └─────────┘
```

### Flujo de Anclaje

1. **Hash Engine** computa SHA-256 del Evidence Pack serializado
2. **trust_proofs** record se crea con status `pending`
3. **Hedera HCS** recibe el hash + metadata via `TopicMessageSubmitTransaction`
4. Receipt devuelve `sequence_number` + `transaction_id`
5. **trust_proofs** se actualiza a `anchored`
6. **consignment_cases** refleja el `anchor_status`

### Flujo de Verificación

1. Importador tiene el Evidence Pack + hash
2. Consulta Mirror Node REST API por `topic_id/sequence_number`
3. Decodifica el mensaje base64
4. Compara `pack_hash` del mensaje con el hash del pack
5. Si coinciden → **Criptográficamente Verificado**

---

## Archivos Creados/Modificados

### Nuevos Archivos

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/20260406100000_trust_proofs_hedera.sql` | Tabla trust_proofs, triggers, RLS, funciones helper |
| `src/config/hedera.ts` | Configuración de red Hedera, URLs de HashScan/Mirror Node |
| `src/types/hedera.types.ts` | TrustProof, HederaMessagePayload, MirrorNodeVerification, etc. |
| `src/services/hederaService.ts` | Servicio principal: hash, submit, anchor, verify, retry |
| `src/services/dashboardService.ts` | Método `getAnchoringStats` añadido |
| `src/components/consignment/TrustProofCard.tsx` | Card de integridad criptográfica en sidebar |
| `src/components/consignment/AnchorTimeline.tsx` | Timeline de auditoría con timestamps Hedera |
| `scripts/setup-hedera-topic.ts` | Script para crear Topic ID en Hedera Testnet |
| `src/__tests__/services/hederaService.test.ts` | 6 tests unitarios |

### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/pages/ConsignmentWorkbench.tsx` | TrustProofCard + AnchorTimeline en sidebar |
| `src/pages/Dashboard.tsx` | Sección "Network Health" con stats de anclaje |
| `.env` | Variables VITE_HEDERA_* template |
| `package.json` | Dependencia `@hashgraph/sdk` |

---

## Tabla: trust_proofs

```sql
CREATE TABLE trust_proofs (
  id UUID PRIMARY KEY,
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id),
  pack_hash TEXT NOT NULL,              -- SHA-256 del Evidence Pack
  pack_version INTEGER NOT NULL,        -- Versión monotónica
  input_hashes TEXT[],                  -- Hashes individuales de evidencia
  topic_id TEXT,                        -- Hedera Topic ID
  sequence_number BIGINT,               -- Sequence number (único por topic)
  consensus_timestamp TEXT,             -- Timestamp de consenso Hedera
  transaction_id TEXT,                  -- Transaction ID de Hedera
  running_hash TEXT,                    -- Running hash del topic
  status anchor_status NOT NULL,        -- pending|pending_anchor|anchored|failed|verified
  retry_count INTEGER DEFAULT 0,
  message_payload JSONB,                -- Lo que se envió a Hedera
  ...timestamps
);

-- Constraint: no duplicar anclaje de misma versión
CONSTRAINT unique_consignment_version UNIQUE (consignment_id, pack_version)
```

### RLS Policies

- **SELECT**: Cualquier usuario autenticado puede ver trust proofs (audit trail público)
- **INSERT**: Solo `compliance_lead` y `system_admin`
- **UPDATE**: Solo `compliance_lead` y `system_admin`
- **DELETE**: No permitido (inmutable)

---

## Servicio: hederaService

### Métodos

| Método | Descripción |
|--------|-------------|
| `computePackHash(consignmentId)` | SHA-256 determinista del Evidence Pack |
| `submitToHCS(payload)` | Envía mensaje al Topic de Hedera |
| `anchorEvidencePack(request)` | Flujo completo: hash → DB → Hedera → update |
| `retryPendingAnchors()` | Reintenta anclajes fallidos (max 3 intentos) |
| `verifyProof(proofId)` | Verifica via Mirror Node REST API |
| `verifyByHash(packHash)` | Verificación por hash (para externos) |
| `getConsignmentProofs(id)` | Lista de proofs por consignment |
| `getLatestProof(id)` | Último proof de un consignment |

### Protecciones

- **Idempotency guard**: Trigger `prevent_duplicate_anchor` impide anclar la misma versión dos veces
- **PENDING_ANCHOR**: Si Hedera falla, el proof queda en cola con retry automático
- **Max retries**: 3 intentos antes de marcar como `failed`
- **No bloqueo**: La operación logística continúa aunque Hedera no responda

---

## Setup Hedera (5 minutos)

### 1. Crear cuenta Hedera Testnet (gratis)
```
https://portal.hedera.com/
```

### 2. Crear Topic
```bash
npx ts-node --esm scripts/setup-hedera-topic.ts
```

### 3. Configurar .env
```
VITE_HEDERA_NETWORK="testnet"
VITE_HEDERA_TOPIC_ID="0.0.XXXXX"
VITE_HEDERA_OPERATOR_ID="0.0.XXXXX"
VITE_HEDERA_OPERATOR_KEY="302e...your-key"
```

### 4. Aplicar migración
```bash
npx supabase db push
```

---

## UI Components

### TrustProofCard (Sidebar del Workbench)
- Muestra hash del Evidence Pack
- Status badge: Pending / Anchored / Verified
- Metadata de Hedera: Topic, Sequence #, Transaction ID
- Botón "Anchor Evidence Pack" / "Verify on Hedera"
- Historial de versiones
- Link directo a HashScan

### AnchorTimeline (Sidebar del Workbench)
- Timeline vertical con 5 estados:
  1. Harvest registered (Local)
  2. Evidence collected (Local)
  3. Pack hash computed (Local)
  4. Anchored on Hedera 🟢 (Consensus)
  5. Evidence Pack sealed 🟢 (Verified)
- Timestamps locales vs consenso de Hedera

### Dashboard Network Health
- 4 cards: Anchored / Verified / Pending / Last Anchor
- Link a HashScan explorer
- Estado vacío si Hedera no está configurado

---

## Tests

```
✓ hederaService > computePackHash > should compute SHA-256
✓ hederaService > submitToHCS > should return error when not configured
✓ hederaService > anchorEvidencePack > should prevent double-anchoring
✓ hederaService > anchorEvidencePack > should create trust proof and submit
✓ hederaService > getConsignmentProofs > should return proofs
✓ hederaService > getLatestProof > should return null when no proofs
```

---

## Plan de Testeo (Prueba de Fuego)

### Test 1: Verificación Externa
1. Anclar un Evidence Pack → obtener `transaction_id`
2. Ir a https://hashscan.io/testnet/transaction/{txId}
3. Verificar que el hash en el mensaje coincide con el pack

### Test 2: Doble Gasto de Estado
1. Anclar consignment CS-2026-001 v1
2. Intentar anclar CS-2026-001 v1 de nuevo
3. El sistema debe rechazar con error "already anchored"

### Test 3: Costo Operativo
1. Ejecutar 100 anclajes seguidos
2. Verificar balance del wallet en Hedera portal
3. Costo total debe ser ~$0.01 USD ($0.0001 × 100)

---

## Verificación Final

- **TypeScript**: 0 errors (`npx tsc --noEmit --skipLibCheck`)
- **Tests**: 35/35 pass (5 test files, including 6 new hedera tests)
- **Dependency**: `@hashgraph/sdk` installed
- **Migration**: `20260406100000_trust_proofs_hedera.sql` ready to apply
