# MVP Definition — Consignment Readiness Engine

**Date:** 2026-03-29
**Status:** Active

---

## 1. Internal Name

**Consignment Readiness Engine**

## 2. What It Does

Takes a consignment and converts dispersed evidence into:

1. **Computed state** — evidence completeness, attribution strength, custody continuity
2. **Visible exceptions** — blocking/warning decision blockers
3. **Use-case readiness** — import readiness, financing readiness
4. **Verifiable evidence pack** — exportable, hashable, shareable

## 3. What It Does NOT Do

- Consumer scan / QR verification UX
- Marketplace / listing / ordering
- Decorative trust score
- Multi-crop expansion
- Underwriting integrations (real)
- IPFS / x402 / AP2 / UCP / A2A protocols

## 4. Output Contract

A consignment produces **exactly** these outputs:

| Output | Type | Description |
|--------|------|-------------|
| `readiness_status` | enum: `not_ready`, `partial`, `ready` | Overall consignment readiness |
| `blocking_exceptions` | `Exception[]` | List of blocking decision blockers |
| `evidence_completeness` | 0–100 score | % of required evidence present |
| `attribution_strength` | 0–100 score | % of evidence with attributed attestations |
| `custody_continuity` | 0–100 score | Custody chain completeness (no gaps) |
| `evidence_pack_hash` | SHA-256 string | Hash of serialized evidence pack |
| `decision_readiness_import` | boolean | Can this consignment clear import? |
| `decision_readiness_financing` | boolean | Is this consignment financeable? |

**NOT a timeline. NOT a dashboard. The product computes decision state.**

## 5. Unit of Work

The operational unit is **`consignment_case`**, not `lot`.

- A consignment groups 1+ lots
- Lots are evidence containers (origin, attributes, events)
- Consignment is the decision boundary (readiness, exceptions, pack)

## 6. Primary User

**Export manager / compliance lead**

They need to:
- Create a consignment grouping lots
- Attach evidence (certificates, documents, measurements)
- See what's blocking readiness
- Generate an evidence pack for a buyer or financing entity

## 7. Core Data Model

```
consignment_cases
  ├── consignment_lots → lots (1:N)
  ├── evidence_objects (certificates, documents, measurements)
  ├── attestations (attributed claims by actors)
  ├── exceptions (blocking/warning blockers)
  └── state_snapshots (computed readiness at point in time)
```

### Tables

#### consignment_cases
- `id`, `exporter_actor_id`, `importer_name`, `destination_market`, `destination_country`
- `status`, `current_snapshot_id`, `public_reference`, `created_at`

#### consignment_lots
- `id`, `consignment_id`, `lot_id`, `role_in_consignment` (primary, partial, aggregated)

#### evidence_objects
- `id`, `consignment_id`, `lot_id` (nullable)
- `type` (certificate, document, event, measurement, manifest, other)
- `source_type` (actor, third_party, sensor, system)
- `source_actor_id`, `title`, `storage_path`, `sha256_hash`, `mime_type`
- `captured_at`, `visibility` (private, shared, public), `status` (active, superseded, rejected)

#### attestations
- `id`, `consignment_id`, `evidence_object_id`, `actor_id`
- `attestation_type`, `claim_key`, `claim_value`
- `signed_at`, `signature_method`, `status`

#### exceptions
- `id`, `consignment_id`, `type`, `severity` (blocking, warning)
- `title`, `description`, `detected_by` (system, user, auditor)
- `status` (open, resolved, ignored), `evidence_object_id` (nullable)
- `created_at`, `resolved_at`

#### state_snapshots
- `id`, `consignment_id`, `snapshot_version`
- `evidence_completeness`, `attribution_strength`, `custody_continuity`
- `decision_readiness_import`, `decision_readiness_financing`
- `blocking_exception_count`, `warning_exception_count`
- `computed_at`, `computed_by`, `snapshot_hash`

## 8. Exception Rules (Minimum)

| Rule | Severity | Trigger |
|------|----------|---------|
| Required certificate missing | blocking | No evidence_object of type=certificate for required cert type |
| Document expired | blocking | evidence_object.captured_at older than policy threshold |
| Incomplete evidence | warning | evidence_completeness < 80% |
| Custody gap | blocking | Missing handoff between expected custody points |
| Missing attestation | warning | Evidence exists but no attestation from required actor |

## 9. Evidence Pack Contents

| Section | Source |
|---------|--------|
| Consignment header | `consignment_cases` |
| Associated lots | `consignment_lots` → `lots` + `lot_attributes` |
| Critical evidence | `evidence_objects` where status=active |
| Attestations | `attestations` for this consignment |
| Exceptions | `exceptions` (all, with resolution status) |
| Current snapshot | Latest `state_snapshots` |
| Pack hash | SHA-256 of serialized JSON |

## 10. Signing Strategy

- **Backend-first smart wallet.** No MetaMask UX for users.
- System signs: snapshot hashes, evidence pack hashes.
- Interface: `SignerService { signSnapshot, signEvidencePack, verifyAnchor }`
- Chain adapter pattern: swap chains without changing service consumers.
- Smart contract: `MangoChainRegistry.sol` — evidence anchoring only, no data on-chain.

## 11. UI Structure

One main experience with two lenses (NOT two apps):

| Tab | What it shows |
|-----|---------------|
| **Import Readiness** | Blocking exceptions, evidence completeness, attestation coverage, custody continuity |
| **Financing Readiness** | Evidence sufficiency, custody score, exception count, doc recency, eligibility flag |

Same snapshot, different lens. Same sidebar. Same data model.

### Screens (Buyer Workflow)
1. **Consignment Overview** — header, lots, status
2. **Evidence** — attached evidence objects, upload
3. **Attestations** — claims by actors, request/register
4. **Exceptions** — blockers/warnings, resolution
5. **Readiness** — scorecard (import + financing tabs)
6. **Evidence Pack** — generate, download, verify

## 12. What Smart Wallets Do NOT Solve

- Evidence completeness
- Exception resolution
- UX quality
- Business model

They solve: verifiable anchoring of snapshot + pack hashes without user friction.
