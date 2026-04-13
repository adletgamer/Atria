# Stage 2 — Architectural Review

**Date**: 2026-03-29
**Workflow**: `.windsurf/workflows/run-architectural-review.md`

---

## 1. Model Violations

### CRITICAL: console.log/error in services (36 occurrences)

All 9 service files use `console.error` instead of `logger` from `@/utils/logger.ts`.

| Service | Count | Verdict |
|---------|-------|---------|
| `lotService.ts` | 8 | **Must fix** |
| `consignmentService.ts` | 7 | **Must fix** |
| `trackingService.ts` | 6 | **Must fix** |
| `verificationService.ts` | 4 | **Must fix** |
| `anchorService.ts` | 3 | **Must fix** |
| `dashboardService.ts` | 2 | **Must fix** |
| `documentService.ts` | 2 | **Must fix** |
| `evidenceService.ts` | 2 | **Must fix** |
| `handoffService.ts` | 2 | **Must fix** |

**No service currently imports `logger`.** This was created but never adopted.

### WARNING: Legacy references in comments only

- `lotService.ts:4` — comment "Reemplaza batchService.ts" (comment only, no import)
- `verificationService.ts:4` — comment "Reemplaza useScanTracking" (comment only, no import)

**Verdict**: Safe. No actual imports from legacy.

### OK: ServiceResult pattern

All 12 services return `ServiceResult<T>`. No service throws exceptions to callers.

### OK: No DEMO_ prefixed data

Zero matches across entire `src/`.

## 2. localStorage Usage

| File | Usage | Verdict |
|------|-------|---------|
| `useLanguage.tsx` | Language preference | **OK** (allowed) |
| `useAuth.tsx` | Session redirect | **OK** (allowed) |
| `useMetaMask.tsx` | Wallet connection state | **OK** (allowed) |
| `legacy/useScanTracking.tsx` | Legacy scan data | **OK** (in legacy/) |
| `verificationService.ts` | Comment reference only | **OK** |

**No business data in localStorage.** Clean.

## 3. Duplication Check

### WARNING: Two evidence models coexist

- `consignment_documents` table (migration 1) — typed documents with `doc_type`, `verified`, `file_url`
- `evidence_objects` table (migration 2) — first-class evidence with `evidence_type`, `content_hash`, `visibility`

`compute_evidence_completeness()` RPC checks **`consignment_documents`** only.
`evidenceService.ts` operates on **`evidence_objects`** only.
`complianceService.getEvidenceCompleteness()` calls the RPC (documents path).
`ConsignmentWorkbench` fetches `evidence_objects` for the matrix.

**This means**: the evidence matrix shows `evidence_objects` but completeness is scored from `consignment_documents`. These are two separate collections.

**Verdict**: **Must reconcile.** Either:
- (a) Migrate completeness RPC to count `evidence_objects` by required `evidence_type`, or
- (b) Treat `consignment_documents` as the legacy doc model and `evidence_objects` as the canonical model.

**Recommendation**: Option (a). Make `evidence_objects` the single source. Update `compute_evidence_completeness` to check `evidence_objects`.

### OK: No parallel V2 pages

One version of each screen. No duplicates.

### OK: No duplicate type definitions

Types are centralized in `consignment.types.ts` (780 lines) and `lot.types.ts`.

## 4. Scope Violations

| Check | Result |
|-------|--------|
| Marketplace features | **None found** |
| Consumer scan features | **None** (Rastrear page is public pack verification, not consumer scan) |
| Wallet UX | `useMetaMask.tsx` exists but is only used for backend anchor signing, not user-facing wallet UX. **OK for now.** |
| IPFS as primary storage | **None** |
| x402/AP2/UCP/A2A | **None** |

## 5. Missing Patterns

### CRITICAL: No exception generator function

Exceptions are only manually inserted. No automated rule engine that:
- Detects missing required documents
- Detects expired documents
- Detects missing attestations
- Detects custody gaps

**This is the core product gap.** Without automated exception detection, the system cannot compute decision state.

### WARNING: Seed data is Stage 1 only

`seed.sql` contains lot data only. No `consignment_cases`, `evidence_objects`, `consignment_exceptions`, or `state_snapshots` seed data exists. The vertical slice cannot be demonstrated.

### WARNING: `state_snapshots` missing key fields

Current `state_snapshots` table has:
- `evidence_completeness_pct` ✓
- `blocking_exceptions` ✓
- `open_exceptions` ✓
- `custody_gap_count` ✓

Missing from snapshot (needed for scorecard):
- `attribution_strength` (currently computed client-side)
- `decision_readiness_import` (boolean)
- `decision_readiness_financing` (boolean)
- `custody_continuity_score` (numeric 0-100)

**Recommendation**: Add these 4 fields to `state_snapshots` table and compute them in `create_state_snapshot` RPC.

## 6. Summary

| Category | Count | Risk |
|----------|-------|------|
| **Critical** | 3 | console.log in services, no exception generator, evidence model split |
| **Warning** | 3 | no seed data, snapshot missing fields, attribution computed client-side |
| **Info** | 2 | legacy comment references, useMetaMask existence |
| **Clean** | 5 | no DEMO_, no localStorage abuse, no scope creep, no duplicates, ServiceResult consistent |

## 7. Required Actions Before Backend Integration

1. **Migrate services to logger** — replace all `console.error` with `logger.error`
2. **Unify evidence model** — update `compute_evidence_completeness` to use `evidence_objects`
3. **Add snapshot fields** — `attribution_strength`, `decision_readiness_import`, `decision_readiness_financing`, `custody_continuity_score`
4. **Build exception generator** — 4 rules: missing doc, expired doc, missing attestation, custody gap
5. **Create consignment seed data** — at least 2 consignments with evidence, exceptions, handoffs
