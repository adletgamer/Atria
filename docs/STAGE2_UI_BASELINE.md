# Stage 2 — UI Baseline Freeze

**Date**: 2026-03-29
**Purpose**: Lock what exists so backend integration proceeds against a stable frontend.

---

## Pages

| Page | File | Status | Notes |
|------|------|--------|-------|
| Consignments List | `src/pages/Consignments.tsx` | **Real** | Fetches `consignment_cases` from Supabase. Cards with status badges, destination, kg/pallets. Empty state handled. |
| Consignment Workbench | `src/pages/ConsignmentWorkbench.tsx` | **Real structure, placeholder data path** | 3-zone layout wired to `complianceService.getComplianceReadiness()`. All 7 central components + sidebar rendered. Data flows from real Supabase queries. Will show empty/zero states until seed data exists for consignment tables. |

## Components (src/components/consignment/)

| Component | Status | Props Source | Notes |
|-----------|--------|-------------|-------|
| `ConsignmentHeader` | **Real** | `ConsignmentCase` fields | Sticky header with case_number, status badge, destination, blocking count, last computed. |
| `ReadinessHero` | **Real** | Computed from `ComplianceReadiness` | Import/financing badges derived from completeness/continuity thresholds. |
| `ScorecardGrid` | **Real** | `evidence_completeness`, `attribution_strength`, `custody_continuity` | Attribution strength computed client-side from attestation present/missing ratio. **Needs backend `attribution_strength` field in snapshot.** |
| `ExceptionsPanel` | **Real** | `ConsignmentException[]` from Supabase | Blocking first, warnings, resolved. Resolve CTA prop available but not wired to backend action yet. |
| `EvidenceCoverageMatrix` | **Real structure, adapter needed** | `EvidenceObject[]` mapped to `EvidenceRow` | Maps evidence_objects to rows. Missing critical types from `compute_evidence_completeness` shown as gap rows. Attestation link check is client-side array search. |
| `AttestationList` | **Real** | `ConsignmentAttestation[]` from Supabase | Active/revoked split. Shows att_type, role_at_time, evidence_refs count, sig_method. |
| `CustodyTimeline` | **Real** | `ConsignmentHandoff[]` from Supabase | Vertical timeline with ack status. Gap count from `compute_custody_continuity`. |
| `EvidencePackCard` | **Real** | Derived from `Anchor` + `StateSnapshot` | Pack hash from anchor or snapshot. Generate/download/verify buttons. Generate calls `complianceService.generateCompliancePack()`. |
| `QuickActions` | **Shell** | Callbacks only | Recompute State and Export Pack wired. Add Evidence, Request Attestation, Verify Hash not yet wired to dialogs/flows. |

## Services Used by UI

| Service | Called From UI | Status |
|---------|---------------|--------|
| `complianceService.getComplianceReadiness()` | ConsignmentWorkbench | **Real** — calls 6 parallel queries + RPCs |
| `complianceService.generateCompliancePack()` | ConsignmentWorkbench | **Real** — snapshot + pack + anchor flow |
| `supabase.rpc("create_state_snapshot")` | ConsignmentWorkbench | **Real** — RPC exists in migration 3 |
| `supabase.from("consignment_cases")` | Consignments list | **Real** — direct query |
| `supabase.from("consignment_exceptions")` | ConsignmentWorkbench | **Real** — direct query |
| `supabase.from("consignment_attestations")` | ConsignmentWorkbench | **Real** — direct query |
| `supabase.from("consignment_handoffs")` | ConsignmentWorkbench | **Real** — direct query |
| `supabase.from("evidence_objects")` | ConsignmentWorkbench | **Real** — direct query |

## What Is NOT Real Yet

1. **No consignment seed data** — `seed.sql` only has Stage 1 lot data. No `consignment_cases` rows exist.
2. **No exception generator** — exceptions are only created manually. No automated rule engine that fires on evidence gaps/expired docs.
3. **Attribution strength** — computed client-side from attestation ratio. Should be a snapshot field.
4. **QuickActions** — "Add Evidence" and "Request Attestation" are not wired to dialogs.
5. **`onResolve` in ExceptionsPanel** — prop exists but no handler passed from ConsignmentWorkbench.
6. **Exporter name** — `ConsignmentHeader.exporterName` always receives `null` (need profile join).

## Decision: What to Keep vs Refactor

| Item | Verdict | Reason |
|------|---------|--------|
| 3-zone layout | **Keep** | Matches spec exactly |
| All 9 components | **Keep** | Props match backend contracts |
| complianceService integration | **Keep** | Real queries, real RPCs |
| Client-side attribution calc | **Refactor** | Move to `create_state_snapshot` RPC or add `attribution_strength` field |
| Exception resolve handler | **Wire** | Add handler in ConsignmentWorkbench calling `consignment_exceptions` update |
| Exporter name | **Wire** | Join `profiles` in case query or pass from service |
| Seed data | **Must create** | Vertical slice cannot be proven without it |
| Exception generator | **Must build** | Core product — no exceptions = no decision product |

---

## Frozen. Do not redesign these components until vertical slice 1 is proven end-to-end.
