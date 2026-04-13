# Stage 2 MVP Definition — Single Product, Two Lenses

## Core Thesis

**There is ONE MVP, not two separate products.**

The product is a **Consignment Decision Workbench** that computes readiness state and surfaces decision-critical information.

## What This Is

A B2B institutional tool that takes a consignment and converts dispersed evidence into:
- Computed state
- Visible exceptions
- Use-case readiness (import / underwriting)
- Verifiable evidence pack

## What This Is NOT

- ❌ A consumer scan app
- ❌ A marketplace
- ❌ A decorative trust score dashboard
- ❌ Two separate applications (Demo 1 vs Demo 2)
- ❌ A blockchain explorer
- ❌ A tracking timeline as primary narrative

## The Two "Demos" Are Actually Two Views

**Import Readiness** and **Underwriting Readiness** are **decision contexts**, not separate products.

They are:
- Two lenses on the same snapshot
- Two sets of evaluation criteria
- Two readiness assessments computed from the same evidence

They share:
- Same consignment data
- Same evidence objects
- Same attestations
- Same custody chain
- Same exceptions
- Same evidence pack

## Primary Unit: ConsignmentCase

The consignment is the operational unit, not the lot.

A consignment:
- Groups multiple lots
- Has a single destination
- Has one exporter
- Has one operative window
- Produces one evidence pack
- Has one readiness state per decision context

## Decision Contexts

### Import Readiness
**Question**: Can this consignment clear customs and regulatory inspection?

**Criteria**:
- Evidence completeness ≥ 80%
- No custody gaps
- No blocking exceptions
- Core attestations present (phyto, export clearance, quality)

**Reasons for**:
- All required documents present
- Custody chain continuous
- No regulatory blocks
- Attestations from authorities

**Reasons against**:
- Missing critical documents
- Custody gaps detected
- Regulatory blocks active
- Missing attestations

### Underwriting Readiness
**Question**: Can this consignment be used as collateral for financing?

**Criteria**:
- Evidence sufficiency ≥ 70%
- Custody continuity ≥ 70
- No blocking exceptions
- Multiple custody transfers recorded

**Reasons for**:
- Sufficient evidence coverage
- Strong custody continuity
- No blockers
- Multiple handoffs documented

**Reasons against**:
- Insufficient evidence
- Weak custody chain
- Blocking exceptions
- Limited custody documentation

## User Personas (Priority Order)

1. **Export Manager** (primary) — creates consignments, uploads evidence, requests attestations
2. **Compliance Lead** (primary) — reviews readiness, resolves exceptions, generates packs
3. **Auditor** (secondary) — reviews evidence packs, verifies anchors
4. **External Reviewer** (secondary) — receives shared packs, verifies authenticity

## Core Workflow

```
1. Create consignment
2. Link lots
3. Upload evidence
4. Request attestations
5. View exceptions
6. Recompute snapshot
7. Generate pack
8. Share/verify
```

## Output Contract

A consignment produces exactly these outputs:

```typescript
{
  readiness_status: 'not_ready' | 'partial' | 'ready',
  blocking_exceptions: Exception[],
  evidence_completeness: 0-100,
  attribution_strength: 0-100,
  custody_continuity: 0-100,
  evidence_pack_hash: string,
  decision_readiness_import: boolean,
  decision_readiness_financing: boolean,
  warning_exceptions: number,
  blocking_exceptions: number
}
```

**NOT** a timeline. **NOT** a dashboard. The product computes decision state.

## Technical Architecture

### Single Source of Truth
Supabase PostgreSQL — no localStorage for business data, no mock data in runtime.

### Unit of Work
`consignment_case` — lots are evidence containers grouped under consignments.

### Append-Only Events
`lot_events`, `consignment_events`, `state_transitions` are immutable. No UPDATE/DELETE.

### Atomic Transactions
Use RPC functions for multi-table inserts. Never multi-step inserts from client.

### Evidence Model
`evidence_objects` is canonical. `consignment_documents` is legacy.

### Smart Wallet
Backend-first system signer. No MetaMask UX for export managers in MVP.

### On-Chain
Evidence pack hash anchoring only. No data on-chain. No wallet-first UX.

## UI Structure

### Single Workbench
`/consignments/:id` — the ConsignmentWorkbench

### Decision Mode Selector
Segmented control: Import Readiness | Underwriting Readiness

Same page, same data, different evaluation lens.

### No Separate Routes
- ❌ `/compliance/:id`
- ❌ `/financing/:id`
- ✅ `/consignments/:id` with mode selector

## Metrics (3 Hard Metrics)

1. **Time to Evidence Pack** — pack_requested_at → pack_generated_at (target <30min MVP, <10min serious)
2. **Time to Third-Party Verification** — verification_requested_at → verification_completed_at
3. **Critical Uncertainty Reduction** — % consignments with zero blockers + completeness ≥80% + zero custody gaps

## What Gets Frozen

Consumer scan, tokenization, lender marketplace, multi-chain UX, mobile app, vanity dashboards, tracking timeline as primary narrative, wallet language in main flow.

## Success Criteria

The MVP is successful if:
1. An export manager can create a consignment and upload evidence
2. The system auto-evaluates exceptions
3. A compliance lead can see import readiness with structured reasons
4. An underwriter can see financing readiness with structured reasons
5. An evidence pack can be generated and shared
6. A third party can verify the pack hash

## Non-Goals for MVP

- Multi-crop support
- Consumer-facing QR scan
- Marketplace for buyers
- Multi-chain anchoring
- Mobile native app
- Real-time collaboration
- Advanced analytics dashboard
