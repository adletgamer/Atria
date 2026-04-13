# Stage 2 — Canonical Backend Contracts

**Date**: 2026-03-29
**Purpose**: Define exact payloads consumed by frontend before coding backend changes.

---

## 1. Create Consignment

**Service**: `consignmentService.createCase(payload)`
**RPC**: `create_consignment_case`

```ts
// Request
interface CreateConsignmentPayload {
  case_number: string;          // CS-YYYY-NNN format
  exporter_id: string;          // UUID — profiles.id
  destination_country: string;  // ISO 3166-1 alpha-2 or full name
  destination_port?: string;
  incoterm?: string;            // FOB, CIF, etc.
  estimated_departure?: string; // ISO date
  importer_id?: string;         // UUID — profiles.id
}

// Response
ServiceResult<{ case_uuid: string; case_number: string }>
```

**Validation**: case_number must match `^CS-\d{4}-\d{3,6}$`. Unique constraint.

---

## 2. Attach Evidence

**Service**: `evidenceService.createEvidence(payload)` or `evidenceService.uploadAndCreateEvidence(file, payload)`

```ts
// Request (metadata only — hash computed client-side)
interface CreateEvidencePayload {
  consignment_id?: string;
  lot_id?: string;
  evidence_type: EvidenceType;   // 'document' | 'photo' | 'certificate' | ...
  source_system?: string;        // default 'platform'
  storage_uri?: string;
  content_hash: string;          // SHA-256 of file content
  file_size_bytes?: number;
  mime_type?: string;
  created_by: string;            // UUID — profiles.id
  visibility?: EvidenceVisibility; // default 'participants'
  title?: string;
  description?: string;
}

// Response
ServiceResult<EvidenceObject>
```

**File upload flow**:
1. Client computes SHA-256 of file
2. Uploads to Supabase Storage (`evidence` bucket)
3. Calls `createEvidence` with hash + storage URI
4. Trigger logs `evidence.attached` event

---

## 3. Compute State (Generate Exceptions + Snapshot)

**Service**: `exceptionService.evaluateConsignment(consignmentId, actorId)`

```ts
// Request
evaluateConsignment(consignmentId: string, actorId: string): Promise<ServiceResult<ExceptionEvaluation>>

// Response
interface ExceptionEvaluation {
  consignment_id: string;
  new_exceptions: ConsignmentException[];
  auto_resolved: ConsignmentException[];
  snapshot_id: string;
  snapshot: StateSnapshot;
}
```

**Rules evaluated**:
1. Missing required evidence type → `doc_missing` / `blocking`
2. Expired document (expires_at < now) → `doc_expired` / `blocking`
3. Missing required attestation → `missing_attestation` / `warning`
4. Custody gap (unsigned handoffs or missing receiver_ack) → `custody_gap` / `blocking`

**After evaluation**: calls `create_state_snapshot` RPC automatically.

---

## 4. Fetch Workbench Data

**Service**: `complianceService.getComplianceReadiness(consignmentId)`

```ts
// Response
interface ComplianceReadiness {
  consignment_id: string;
  case_number: string;
  current_state: CaseState;
  blocking_exceptions: ConsignmentException[];
  evidence_completeness: EvidenceCompleteness;
  attestations_present: string[];
  attestations_missing: string[];
  custody_continuity: CustodyContinuity;
  can_generate_pack: boolean;
  last_anchor: Anchor | null;
  last_snapshot: StateSnapshot | null;
}
```

**Parallel queries**:
- `consignment_cases` (single row)
- `compute_evidence_completeness` RPC
- `compute_custody_continuity` RPC
- `consignment_exceptions` (blocking, unresolved)
- `consignment_attestations` (present types vs required)
- `anchors` (latest evidence_pack)
- `state_snapshots` (latest)

**StateSnapshot extended fields** (to add):
```ts
interface StateSnapshot {
  // ... existing fields ...
  attribution_strength: number;           // 0-100
  custody_continuity_score: number;       // 0-100
  decision_readiness_import: boolean;
  decision_readiness_financing: boolean;
}
```

---

## 5. Generate Evidence Pack

**Service**: `complianceService.generateCompliancePack(consignmentId, requestedBy)`

```ts
// Request
generateCompliancePack(
  consignmentId: string,
  requestedBy: string,
  contractAddress?: string,
  chainId?: number
): Promise<ServiceResult<{
  readiness: ComplianceReadiness;
  pack_hash: string;
  anchor_tx: string | null;
}>>
```

**Flow**:
1. Mark `pack_requested_at` on consignment
2. Create state snapshot (trigger: `evidence_pack_request`)
3. Get compliance readiness assessment
4. Generate evidence pack (hash all evidence → Merkle root)
5. Mark `pack_generated_at` on consignment
6. If contract provided: anchor on-chain via `anchorService`
7. Return readiness + pack_hash + anchor_tx

---

## 6. Resolve Exception

**Service**: `exceptionService.resolveException(payload)` (to build)

```ts
// Request
interface ResolveExceptionPayload {
  exception_id: string;
  resolved_by: string;   // UUID — profiles.id
  resolution: string;    // free text explanation
}

// Response
ServiceResult<void>
```

**Side effects**: trigger logs `exception.resolved` event.

---

## Type Reference

All types live in `src/types/consignment.types.ts`. Key enums:

- `EvidenceType`: document, photo, lab_result, sensor_data, certificate, declaration, inspection_report, treatment_record, transport_log, seal_record, acknowledgment, other
- `ExceptionType`: doc_missing, doc_expired, inspection_fail, quality_deviation, temperature_breach, customs_hold, damage_report, delay, regulatory_block, payment_issue
- `ExceptionSeverity`: info, warning, critical, blocking
- `CaseState`: draft, evidence_collecting, docs_complete, treatment_attested, custody_continuous, import_ready, exception_flagged, under_review, released, rejected
