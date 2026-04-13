# Stage 2 — Vertical Slice Acceptance

**Date**: 2026-03-29
**Status**: Complete (pending Supabase deployment)

---

## Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Create consignment case | ✅ | `consignmentService.createCase()` → RPC `create_consignment_case` → DB insert + auto-event |
| 2 | Attach 3+ evidence objects | ✅ | `evidenceService.createEvidence()` / `uploadAndCreateEvidence()` → `evidence_objects` table + trigger event |
| 3 | Compute state (evaluate exceptions + snapshot) | ✅ | `exceptionService.evaluateConsignment()` → RPC `evaluate_consignment_exceptions` (4 rules) → RPC `create_state_snapshot` |
| 4 | Surface 2+ exception types | ✅ | 4 rules: `doc_missing` (blocking), `doc_expired` (blocking), `regulatory_block`/missing attestation (warning), `customs_hold`/custody gap (blocking) |
| 5 | Update workbench from real backend data | ✅ | `ConsignmentWorkbench.tsx` loads all data via Supabase queries + `complianceService` + `exceptionService` |
| 6 | Resolve exception from UI | ✅ | `ExceptionsPanel.onResolve` → `exceptionService.resolveException()` → DB update + reload |
| 7 | Scorecard uses snapshot fields | ✅ | `ScorecardGrid` reads `attribution_strength`, `custody_continuity_score`, `decision_readiness_*` from snapshot |

## Deliverables

### Migration
- `supabase/migrations/20260329100000_snapshot_fields_and_evidence_unification.sql`
  - 5 new fields on `state_snapshots`: `attribution_strength`, `custody_continuity_score`, `decision_readiness_import`, `decision_readiness_financing`, `warning_exceptions`
  - `compute_evidence_completeness` rewritten to use `evidence_objects` (canonical model)
  - `create_state_snapshot` rewritten to compute all decision fields
  - New RPC: `evaluate_consignment_exceptions` (4 rules with auto-create/auto-resolve)

### Service
- `src/services/exceptionService.ts` — evaluate, resolve, list, getBlocking
- All 9 existing services migrated from `console.error` → `logger` (36 calls fixed, 0 remaining)

### Types
- `StateSnapshot` type updated with 5 new fields matching DB

### Seed Data
- `supabase/seed_consignments.sql` — 2 consignment cases:
  - **CS-2026-001**: Near-ready (5/6 evidence, 4/6 attestations, 3 handoffs with 1 gap, 1 warning exception)
  - **CS-2026-002**: Blocked (2/6 evidence, 0 attestations, 1 unsigned handoff, 1 expired doc)
  - Both seeded with `evaluate_consignment_exceptions` + `create_state_snapshot`

### UI Wiring
- `ConsignmentWorkbench.tsx`:
  - "Recompute State" now calls `exceptionService.evaluateConsignment()` (evaluate → snapshot → reload)
  - "Resolve" button wired to `exceptionService.resolveException()`
  - Scorecard uses snapshot fields with client-side fallback
  - `import { exceptionService }` added

### Tests
- `src/__tests__/services/exceptionService.test.ts` — 8 tests covering evaluate, resolve, list, getBlocking
- All 29 tests pass (4 test files)
- TypeScript compiles clean (`tsc --noEmit --skipLibCheck` = 0 errors)

### Documentation
- `docs/STAGE2_UI_BASELINE.md` — frozen UI components with real/placeholder classification
- `docs/STAGE2_ARCHITECTURAL_REVIEW.md` — 3 critical, 3 warning, 5 clean findings
- `docs/STAGE2_API_CONTRACTS.md` — 6 canonical endpoints with exact payloads

## Data Flow (End-to-End)

```
1. User creates consignment
   → consignmentService.createCase()
   → RPC create_consignment_case
   → trigger: case.created event

2. User attaches evidence
   → evidenceService.uploadAndCreateEvidence(file)
   → SHA-256 hash computed client-side
   → Supabase Storage upload
   → evidence_objects insert
   → trigger: evidence.attached event

3. User clicks "Recompute State"
   → exceptionService.evaluateConsignment(id, actorId)
   → RPC evaluate_consignment_exceptions
     → Rule 1: missing evidence types → doc_missing exceptions
     → Rule 2: expired documents → doc_expired exceptions
     → Rule 3: missing attestations → regulatory_block exceptions
     → Rule 4: custody gaps → customs_hold exceptions
     → Auto-resolves exceptions where condition fixed
   → RPC create_state_snapshot
     → Computes: evidence_completeness, attribution_strength, custody_continuity
     → Computes: decision_readiness_import, decision_readiness_financing
     → Stores snapshot_hash (MD5 of JSON, real SHA-256 computed off-chain for pack)
   → UI reloads all data

4. Workbench displays:
   → ConsignmentHeader: case number, status, destination, blocking count
   → ReadinessHero: import/financing ready badges from snapshot
   → ScorecardGrid: 4 metrics from snapshot fields
   → ExceptionsPanel: blocking first, warnings, resolve button
   → EvidenceCoverageMatrix: attached + gap rows
   → AttestationList: present attestations
   → CustodyTimeline: handoffs with signing level
   → EvidencePackCard: hash, anchor status, generate button

5. User resolves exception
   → exceptionService.resolveException()
   → DB update (resolved=true, resolved_at, resolved_by, resolution)
   → trigger: exception.resolved event
   → UI reloads

6. User generates evidence pack
   → complianceService.generateCompliancePack()
   → Merkle root of all evidence hashes
   → Anchor record created
   → Optional: on-chain via MangoChainRegistry.sol
```

## Next Steps

1. **Deploy migration** to Supabase (`supabase db push`)
2. **Run seed** (`supabase db seed` or manual SQL execution)
3. **Verify end-to-end** in browser with real data
4. **P1 items**: Add Evidence dialog, Request Attestation dialog, Verify Hash flow
