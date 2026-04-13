# State Machine — Consignment Readiness

## States

A consignment has exactly one `readiness_status` at any point:

- `not_ready` — blocking exceptions exist OR evidence completeness < threshold
- `partial` — no blockers but evidence/attribution/custody below full readiness
- `ready` — all dimensions above threshold, no blocking exceptions

## Computation

`computeConsignmentState(consignmentId)` produces a `state_snapshot`:

1. Count evidence objects by required type -> `evidence_completeness` (0-100)
2. Count attestations vs required claims -> `attribution_strength` (0-100)
3. Evaluate custody handoff chain -> `custody_continuity` (0-100)
4. Count blocking exceptions -> `blocking_exception_count`
5. Count warning exceptions -> `warning_exception_count`
6. Derive `decision_readiness_import`: completeness >= 80 AND custody >= 80 AND blocking == 0
7. Derive `decision_readiness_financing`: completeness >= 70 AND custody >= 70 AND blocking == 0 AND attribution >= 60
8. Derive `readiness_status`: blocking > 0 ? not_ready : (all >= 80 ? ready : partial)
9. Hash the snapshot -> `snapshot_hash`
10. Persist as new `state_snapshot` row, update `consignment_cases.current_snapshot_id`

## Exception Rules (Minimum)

| Rule | Trigger | Severity |
|------|---------|----------|
| Required certificate missing | No evidence_object of required cert type | blocking |
| Document expired | captured_at older than policy threshold | blocking |
| Incomplete evidence | evidence_completeness < 80% | warning |
| Custody gap | Missing handoff between expected custody points | blocking |
| Missing attestation | Evidence exists but no attestation from required actor | warning |

## Transitions

State transitions are recorded in `state_transitions` table (append-only).
Each transition auto-creates a new `state_snapshot`.
