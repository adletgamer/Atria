# Stage 1 — Formal Closeout

**Close Date:** 2026-03-29
**Version:** 2.0
**Status:** CLOSED

---

## 1. What Was Closed

### Database Schema (5 tables, fully operational)

| Table | Purpose | Rows per lot |
|-------|---------|--------------|
| `lots` | Core identity — immutable lot_id, producer, location | 1 |
| `lot_attributes` | Mutable properties (EAV) — variety, quality, kg, price | N |
| `lot_events` | Append-only timeline — lifecycle, attribute changes, verifications | N |
| `trust_states` | Computed trust score — auto-updated by triggers | 1 |
| `qr_verifications` | QR scan records — device, location, success flag | N |

### RPC Functions (3)
- **`create_lot_complete`** — atomic lot creation (lots + attributes + event + trust_state)
- **`get_lot_timeline`** — full event timeline with actor names
- **`get_lot_with_details`** — lot + attributes + trust_state in one call

### Triggers (4 active)
- `update_lots_updated_at` — auto-update `updated_at` on lots
- `update_lot_attributes_updated_at` — same for attributes
- `trigger_create_initial_lot_event` — auto-create `lot.created` event
- `trigger_create_initial_trust_state` — auto-create trust_state with score 10.00
- `trigger_update_trust_on_verification` — +2.00 trust on successful QR verification

### Services (4 core, operational)

| Service | Lines | Consumes |
|---------|-------|----------|
| `lotService.ts` | 374 | `create_lot_complete`, `get_lot_with_details`, direct queries |
| `trackingService.ts` | 271 | `get_lot_timeline`, `lot_events` insert |
| `verificationService.ts` | 339 | `qr_verifications` insert, trust_state auto-update |
| `dashboardService.ts` | 380+ | Aggregations across lots, attributes, events, trust_states |

### Pages (4 refactored, consuming new schema exclusively)
- **Dashboard.tsx** — `dashboardService.getDashboardStats/getRecentLots/getQualityDistribution/getLocationDistribution`
- **Rastrear.tsx** — `lotService.getLotByLotId` + `trackingService.getLotTimeline`
- **Registration flow** — `lotService.createLot`
- **Verification flow** — `verificationService.createVerification`

### Legacy Cleanup (completed 2026-03-29)
- `batchService.ts` → moved to `/src/legacy/`
- `useScanTracking.tsx` → moved to `/src/legacy/`
- `create_batch_tables.sql` → moved to `/src/legacy/`
- All `DEMO_BATCHES` / `DEMO_DATA` arrays → removed (none found in runtime)
- Dashboard hardcoded fallback location data → replaced with empty state
- Dashboard fake Evidence Completeness / Custody Continuity calculations → replaced with real computed values from DB

### RLS Audit (completed 2026-03-29)
- `trust_states` client INSERT/UPDATE policies → removed (system-only via triggers)
- All SELECT policies reviewed — see `docs/STAGE1_RLS_AUDIT.md`
- Migration: `20260329000000_rls_audit_tighten.sql`

---

## 2. What Was Deliberately Left Out

| Item | Reason | Stage 2 Path |
|------|--------|--------------|
| Blockchain integration | Stage 1 = data model. Blockchain = integrity layer on top. | `anchorService.ts` already scaffolded |
| Sophisticated trust scoring | Current: +2/verification. Needs evidence dimensions. | `complianceService.ts` has evidence completeness model |
| ConsignmentCase grouping | Lots are the unit in Stage 1. Consignments are Stage 2. | `consignment_cases` table already in migration |
| Evidence objects as first-class entities | Stage 1 has `lot_attributes`. Stage 2 needs `evidence_objects`. | Migration `20260327200000` has the table |
| Attestation model | No explicit claim attribution in Stage 1. | `consignment_attestations` table exists |
| Exception model | No blocking/warning exceptions in Stage 1. | `consignment_exceptions` table exists |
| Buyer workflow | Stage 1 is producer-centric. | Stage 2 introduces importer/buyer roles |
| Custody handoffs | Timeline events only. No sender/receiver model. | `consignment_handoffs` + actors table ready |

---

## 3. Residual Technical Debt

### Must Fix (P1, before Stage 2 feature work)

| Item | Impact | Action |
|------|--------|--------|
| No automated tests | Regression risk on any change | Write smoke tests for `create_lot_complete`, `get_lot_timeline`, `verificationService` |
| No seed data | Cannot demo without manual setup | Create `supabase/seed.sql` with 3-5 example lots |
| No structured logging | Blind debugging in production | Add logger util with structured JSON output |
| Supabase auto-generated types include old `batches` table | Confusing for developers | Regenerate types after dropping `batches` table |

### Can Wait (P2)

| Item | Impact | Action |
|------|--------|--------|
| Materialized views have no refresh strategy | Stale data in `lot_verification_counts`, `producer_statistics` | Add `pg_cron` refresh or manual trigger |
| `lot.types.ts` has legacy field patterns | Minor TS confusion | Consolidate in P2.2 |
| No rate limiting on `qr_verifications` INSERT | Potential spam | Add Edge Function or pg_net rate limiter |

---

## 4. Formal Decisions

### Decision 1: Single Source of Truth
**Supabase PostgreSQL is the only source of truth for business data.**

- No localStorage for business state
- No frontend-computed business metrics
- No mock data in core pages
- All mutations go through RPC or direct Supabase client → DB

### Decision 2: No Parallel Pages
**There is one version of each page. No V2/legacy split.**

- Dashboard.tsx consumes dashboardService exclusively
- Rastrear.tsx consumes lotService + trackingService exclusively
- No page imports batchService or useScanTracking

### Decision 3: Legacy Is Quarantined
**Legacy files exist in `/src/legacy/` for reference only.**

- `batchService.ts` — not imported by any runtime code
- `useScanTracking.tsx` — not imported by any runtime code
- `create_batch_tables.sql` — superseded by `20260327000000_create_core_schema_v2.sql`
- These files may be deleted at any time without breaking the app

### Decision 4: Append-Only Events
**`lot_events` is append-only. No UPDATE or DELETE policies exist.**

- Every state change produces an event
- Timeline is reconstructed from events, never from mutable state
- This is the foundation for Stage 2 `state_transitions` and `state_snapshots`

---

## 5. Documentation Index

| Document | Purpose |
|----------|---------|
| `STAGE1_CLOSEOUT.md` | This document — what's closed, what's out, decisions |
| `STAGE1_LEGACY_REMOVAL.md` | Legacy cleanup details, verification commands |
| `STAGE1_E2E_VALIDATION.md` | Reproducible E2E test flow with SQL queries |
| `STAGE1_RLS_AUDIT.md` | RLS policy matrix, before/after, residual risks |
| `stage_1_core_schema.md` | Full schema documentation |
| `IMPLEMENTATION_SUMMARY_STAGE1.md` | Implementation narrative |
| `migration_execution_guide.md` | How to run migrations |

---

## 6. Stage 2 Entry Point

Stage 2 is **not** "more blockchain." Stage 2 is:

**Decision-state engine + evidence pack + buyer workflow**

The system transitions from "lots with tracking" to "verifiable state for decisions."

### Stage 2 P0 primitives (already scaffolded in migrations):
1. **ConsignmentCase** — groups lots under operational unit
2. **EvidenceObject** — first-class evidence entity with hash, type, source
3. **Attestation** — attributed claim by a specific actor
4. **Exception** — blocking/warning that makes decisions computable
5. **StateSnapshot** — point-in-time record of consignment state

### Stage 2 entry criteria:
- [ ] Stage 1 E2E validation passes (STAGE1_E2E_VALIDATION.md)
- [ ] RLS migration applied (20260329000000_rls_audit_tighten.sql)
- [ ] Seed data available for demos
- [ ] At least smoke tests for core RPCs

---

**Close Date:** 2026-03-29
**Version:** 2.0
**Status:** CLOSED — Stage 2 may begin when entry criteria are met
