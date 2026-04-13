# Stage 2 — Prioritized Backlog

**Date:** 2026-03-29
**Product:** Consignment Readiness Engine

---

## P0 — CRITICAL: Build the core engine

### P0.1 — Close Stage 1 officially ✅ DONE

- Refactored Dashboard.tsx
- Eliminated DEMO_BATCHES, useScanTracking, batchService from core
- E2E validation created
- RLS audit completed
- `docs/STAGE1_CLOSEOUT.md` written

**Status:** CLOSED (2026-03-29)

---

### P0.2 — Introduce `consignment_cases`

**Why:** The operational unit of the MVP is `consignment`, not `lot`.

**Tables:**

| Table | Key columns |
|-------|-------------|
| `consignment_cases` | id, exporter_actor_id, importer_name, destination_market, destination_country, status, current_snapshot_id, public_reference, created_at |
| `consignment_lots` | id, consignment_id, lot_id, role_in_consignment (primary/partial/aggregated), created_at |

**Tasks:**
- [ ] SQL migration
- [ ] TypeScript types in `src/types/consignment.types.ts`
- [ ] `consignmentService.ts` (create, get, addLot, removeLot, list)
- [ ] RPC function for atomic consignment + lot association
- [ ] Minimal UI: create consignment, select lots
- [ ] Tests for consignmentService

**Definition of Done:** A consignment can group 1+ existing lots.

---

### P0.3 — Introduce `evidence_objects`

**Why:** Without this, you have records, not evidence.

**Table: `evidence_objects`**

| Column | Type |
|--------|------|
| id | uuid PK |
| consignment_id | uuid FK |
| lot_id | uuid FK nullable |
| type | enum: certificate, document, event, measurement, manifest, other |
| source_type | enum: actor, third_party, sensor, system |
| source_actor_id | uuid FK |
| title | text |
| storage_path | text |
| sha256_hash | text |
| mime_type | text |
| captured_at | timestamptz |
| created_at | timestamptz |
| visibility | enum: private, shared, public |
| status | enum: active, superseded, rejected |

**Tasks:**
- [ ] SQL migration
- [ ] Upload flow using Supabase Storage
- [ ] Server-side SHA-256 hash computation
- [ ] `evidenceService.ts` (upload, attach, list, getByConsignment)
- [ ] UI: attach evidence to consignment
- [ ] Tests for evidenceService

**Definition of Done:** You can attach evidence to a consignment and each object has hash, type, and source.

---

### P0.4 — Introduce `attestations`

**Why:** Not every document is sufficient evidence. You need attributable claims.

**Table: `attestations`**

| Column | Type |
|--------|------|
| id | uuid PK |
| consignment_id | uuid FK |
| evidence_object_id | uuid FK |
| actor_id | uuid FK |
| attestation_type | text |
| claim_key | text |
| claim_value | text |
| signed_at | timestamptz |
| signature_method | text |
| status | enum: pending, confirmed, revoked |

**Tasks:**
- [ ] SQL migration
- [ ] `attestationService.ts` (create, list, revoke)
- [ ] UI: request/register attestation
- [ ] Actor role validation (only authorized actors can attest)
- [ ] Tests for attestationService

**Definition of Done:** A critical claim can be attributed to a specific actor.

---

### P0.5 — Introduce `exceptions`

**Why:** The product does not exist if it cannot model decision blockers.

**Table: `exceptions`**

| Column | Type |
|--------|------|
| id | uuid PK |
| consignment_id | uuid FK |
| type | text |
| severity | enum: blocking, warning |
| title | text |
| description | text |
| detected_by | enum: system, user, auditor |
| status | enum: open, resolved, ignored |
| evidence_object_id | uuid FK nullable |
| created_at | timestamptz |
| resolved_at | timestamptz nullable |

**Minimum exception rules:**
1. Required certificate missing
2. Document expired
3. Incomplete evidence
4. Custody gap
5. Missing attestation

**Tasks:**
- [ ] SQL migration
- [ ] `exceptionService.ts` (create, resolve, ignore, listByConsignment)
- [ ] Exception rules engine (at least 5 rules above)
- [ ] UI: exceptions view with severity filters
- [ ] Tests for exceptionService

**Definition of Done:** A consignment can be explicitly blocked.

---

### P0.6 — Introduce `state_snapshots`

**Why:** This is the heart of the MVP.

**Table: `state_snapshots`**

| Column | Type |
|--------|------|
| id | uuid PK |
| consignment_id | uuid FK |
| snapshot_version | integer |
| evidence_completeness | numeric(5,2) |
| attribution_strength | numeric(5,2) |
| custody_continuity | numeric(5,2) |
| decision_readiness_import | boolean |
| decision_readiness_financing | boolean |
| blocking_exception_count | integer |
| warning_exception_count | integer |
| computed_at | timestamptz |
| computed_by | text |
| snapshot_hash | text |

**Tasks:**
- [ ] SQL migration
- [ ] `stateEngineService.ts` with `computeConsignmentState(consignmentId)`
- [ ] Persist snapshot on each computation
- [ ] Update `consignment_cases.current_snapshot_id` on new snapshot
- [ ] UI: scorecard showing all metrics
- [ ] Tests for stateEngineService

**Definition of Done:** The system can compute a readable state for compliance and financing.

---

### P0.7 — Evidence Pack Generator

**Why:** This is a real output, not cosmetic.

**Pack contents:**
1. Consignment header
2. Associated lots with attributes
3. Critical evidence objects
4. Attestations
5. Exceptions (all, with resolution status)
6. Current snapshot
7. Final SHA-256 hash of serialized pack

**Tasks:**
- [ ] `evidencePackService.ts` (generate, serialize, hash)
- [ ] JSON template for pack structure
- [ ] HTML/PDF exportable view
- [ ] UI: "Generate Evidence Pack" screen
- [ ] Tests for evidencePackService

**Definition of Done:** You can export a readable, shareable, and verifiable package.

---

### P0.8 — Smart-wallet / signer strategy

**Decision:** Backend-first. No wallet UX for users.

**Interface:**

```typescript
interface SignerService {
  signSnapshot(snapshotHash: string): Promise<{ txHash: string; chain: string }>;
  signEvidencePack(packHash: string): Promise<{ txHash: string; chain: string }>;
  verifyAnchor(txHash: string): Promise<boolean>;
}
```

**Tasks:**
- [ ] `signerService.ts` implementing SignerService interface
- [ ] SystemSignerService with backend-managed wallet
- [ ] Chain adapter pattern (swap chains without changing consumers)
- [ ] Integration with MangoChainRegistry.sol
- [ ] Tests for signerService

**Definition of Done:** The product can sign anchors without requiring MetaMask from the user.

---

## P1 — MEDIUM IMPORTANCE

### P1.1 — Buyer workflow UI

**User:** Export manager / compliance lead

**Screens:**
1. Consignment Overview
2. Evidence
3. Attestations
4. Exceptions
5. Readiness (tabs: Import / Financing)
6. Evidence Pack

### P1.2 — Unify demo 1 and demo 2 into single experience

One screen with tabs or segmented control:
- **Import Readiness** tab
- **Financing Readiness** tab

Same snapshot, different lens. NOT two apps, NOT two sidebars, NOT two data models.

### P1.3 — State engine tests

Minimum test cases:
- [ ] Complete consignment → `import_ready`
- [ ] Consignment with missing certificate → blocking
- [ ] Consignment with custody gap → blocking
- [ ] Consignment with partial evidence → financing not eligible
- [ ] Pack generated with correct hash

### P1.4 — Realistic seed data

Required scenarios:
- [ ] 1 consignment fully ready
- [ ] 1 with evidence gaps
- [ ] 1 with blocking exception
- [ ] 1 with expired documentation

### P1.5 — RLS and access model per actor

Explicit rules for who sees what. Must be defined before production:
- Exporter: full read/write on own consignments
- Importer: read-only on shared consignments
- Auditor: read-only on all, can create exceptions
- System: full access via service role

---

## P2 — NOT NOW

| Item | Status |
|------|--------|
| IPFS storage | Deferred |
| x402 protocol | Deferred |
| AP2 / UCP / A2A | Deferred |
| Consumer scan | Deferred |
| Marketplace | Deferred |
| Multi-crop expansion | Deferred |
| Real underwriting integrations | Deferred |
| Public decorative trust score | Deferred |

---

## Execution Order

```
P0.2 consignment_cases
  ↓
P0.3 evidence_objects
  ↓
P0.4 attestations
  ↓
P0.5 exceptions
  ↓
P0.6 state_snapshots (depends on P0.3-P0.5)
  ↓
P0.7 evidence_pack (depends on P0.6)
  ↓
P0.8 signer (depends on P0.7)
  ↓
P1.1-P1.5 (parallel, after P0 complete)
```

Each P0 item is a vertical slice: migration + types + service + tests + minimal UI.
