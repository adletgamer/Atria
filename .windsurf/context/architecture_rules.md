# Architecture Rules — Consignment Readiness Engine

## Core Principles

### Single Source of Truth
**Supabase PostgreSQL** is the authoritative data store.

- ❌ No localStorage for business/functional data
- ❌ No mock data in runtime code
- ❌ No client-side state as source of truth
- ✅ OK: localStorage for lang preference, session, UI state

### Unit of Work
**`consignment_case`** is the primary operational unit, not `lot`.

Lots are evidence containers grouped under consignments.

### Append-Only Events
`lot_events`, `consignment_events`, `state_transitions` are **immutable**.

- ❌ No UPDATE on event tables
- ❌ No DELETE on event tables
- ✅ Insert new events to represent state changes

### Atomic Transactions
Use **RPC functions** for multi-table inserts.

- ❌ Never do multi-step inserts from the client
- ✅ Wrap complex operations in database functions
- ✅ Use transactions for consistency

### Evidence Model
**`evidence_objects`** is the canonical model.

- `consignment_documents` is legacy (Stage 1)
- All new code uses `evidence_objects`
- Evidence has: hash, type, source, visibility, freshness

### EAV Pattern
Use attribute tables for variable data:

- `lot_attributes` for lot properties
- `evidence_objects` for consignment evidence
- ❌ Do not add columns for instance-specific data

## Data Layer

### Tables (13 core + primitives)
- `consignment_cases` — operational unit
- `consignment_lots` — junction: consignment ↔ lot
- `evidence_objects` — first-class evidence with hash
- `attestations` — attributed claims by actors
- `consignment_exceptions` — blocking/warning issues
- `state_snapshots` — point-in-time computed state
- `actors` — people/orgs in the chain
- `actor_roles` — per-consignment role assignments
- `consignment_handoffs` — custody transfers
- `state_transitions` — decision-linked state changes
- `anchors` — on-chain commitments
- `consignment_events` — append-only audit trail
- `consignment_attestations` — legacy attestations

### Enums (14)
- `consignment_status`
- `readiness_state`
- `case_state`
- `document_type`
- `attestation_type`
- `handoff_type`
- `exception_type`
- `exception_severity`
- `evidence_type`
- `evidence_visibility`
- `actor_type`
- `custody_signing_level`
- `snapshot_trigger`
- `pack_status`

### RPC Functions (8)
1. `create_consignment_case` — atomic case creation
2. `create_state_snapshot` — compute + store snapshot
3. `compute_evidence_completeness` — evidence coverage
4. `compute_custody_continuity` — custody score
5. `evaluate_consignment_exceptions` — 4 rules with auto-create/resolve
6. `compute_pack_status` — pack lifecycle state
7. `get_lot_timeline` — lot event history
8. `get_consignment_readiness` — full readiness view

## Service Layer

### ServiceResult Pattern
All services return `ServiceResult<T>`:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

- Services **never throw**
- All exceptions caught internally
- Return `{ success: false, error }` on failure

### Service Organization
One service per domain:

- `consignmentService` — case CRUD
- `evidenceService` — evidence upload/management
- `attestationService` — attestation requests
- `exceptionService` — exception evaluation/resolution
- `stateEngineService` — state transitions
- `evidencePackService` — pack generation
- `signerService` — backend signing
- `complianceService` — import readiness view
- `financingService` — underwriting readiness view
- `metricsService` — 3 hard metrics

### Logging
Use `logger` from `@/utils/logger.ts` instead of raw `console.log/error/warn`.

```typescript
logger.info("event.name", { context }, data);
logger.error("event.name", { context }, error);
```

## Frontend Layer

### Stack
- React + TypeScript + Vite
- TailwindCSS + shadcn/ui
- Path alias: `@/` → `./src/`

### No Parallel Versions
- ❌ No V2 pages
- ❌ No separate compliance/financing apps
- ✅ One ConsignmentWorkbench with decision mode selector

### No Legacy Imports
- ❌ Do not import from `@/legacy/`
- ❌ Do not import `batchService` or `useScanTracking`
- ✅ Use canonical services only

### Icons
`lucide-react` — use sparingly for semantic meaning only

### i18n
`src/config/i18n.ts` with `es`/`en` support

## Blockchain / Signing

### Backend-First Smart Wallet
System signs snapshot hashes and evidence pack hashes.

- ❌ No MetaMask UX for export managers
- ❌ No wallet connection flow in main UI
- ✅ Backend signer service
- ✅ Wallet config hidden in Settings > Advanced

### Interface
```typescript
SignerService {
  signSnapshot(hash: string): Promise<Signature>
  signEvidencePack(hash: string): Promise<Signature>
  verifyAnchor(hash: string, signature: string): Promise<boolean>
}
```

### Chain Adapter Pattern
Swap chains without changing service consumers.

### Smart Contract
`MangoChainRegistry.sol` — evidence anchoring only.

- ❌ No data on-chain
- ❌ No sensitive evidence on-chain
- ✅ Only commitment hashes

## Testing

### Framework
Vitest

### Mocking Supabase
```typescript
vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  // ...
}))

vi.mock("@/integrations/supabase/client")
```

### Test Files
`src/__tests__/services/<service>.test.ts`

### Coverage
- ✅ Test all service functions
- ✅ Test success and error paths
- ❌ Never delete or weaken existing tests without explicit direction

## Migrations

### Location
`supabase/migrations/`

### Naming
`YYYYMMDDHHMMSS_description.sql`

### RLS
Always include:
```sql
ENABLE ROW LEVEL SECURITY;
```

Always include RLS policies in the same migration that creates the table.

### Legacy
Legacy migrations live in `src/legacy/` for reference only.

## Forbidden Patterns

- ❌ `DEMO_` prefixed data in runtime code
- ❌ `localStorage` for business/functional data
- ❌ Importing from `@/services/batchService` or `@/hooks/useScanTracking`
- ❌ Hardcoded fallback data in pages (show empty/loading state instead)
- ❌ Frontend-computed business metrics (compute in DB or service)
- ❌ `console.log` / `console.error` in services (use `logger`)
- ❌ Smart wallet / MetaMask as user-facing UX in MVP
- ❌ Two separate apps/routes for compliance vs financing

## File Structure

```
src/
  services/          — domain services (one per entity)
  pages/             — route-level components
  components/        — shared UI components
  hooks/             — React hooks
  types/             — TypeScript interfaces
  utils/             — logger, helpers
  config/            — i18n, constants
  legacy/            — deprecated files (do not import)
  __tests__/         — Vitest test suites
    services/        — service unit tests
    mocks/           — shared mocks
supabase/
  migrations/        — SQL migrations
  seed.sql           — demo data
docs/                — architecture, audit, closeout docs
contracts/           — Solidity smart contracts
.windsurf/
  context/           — product context files
  workflows/         — reusable agent workflows
  rules/             — project rules
```

## Security

### RLS (Row Level Security)
All tables with user data must have RLS enabled.

### Authorization
Role-based access:
- `export_manager` — create, upload, request
- `compliance_lead` — review, resolve, generate
- `auditor` — read-only, verify
- `external_reviewer` — read shared packs only

### API Keys
Never hardcode API keys. Use environment variables.

### Evidence Storage
Sensitive evidence stored in Supabase Storage with access controls.

## Performance

### Database
- Index foreign keys
- Index frequently queried columns
- Use RPC functions for complex queries
- Avoid N+1 queries

### Frontend
- Lazy load large lists
- Debounce search inputs
- Optimistic UI updates
- Cache static data

## Deployment

### Environments
- `dev` — local development
- `staging` — pre-production
- `production` — live

### Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENVIRONMENT`

### CI/CD
- TypeScript compile check
- Vitest tests
- Migration validation
- Build verification

## Monitoring

### Logs
Structured JSON logs via `logger` utility.

### Metrics
3 hard metrics tracked:
1. Time to Evidence Pack
2. Time to Third-Party Verification
3. Critical Uncertainty Reduction

### Alerts
- Failed pack generation
- Anchor failures
- RPC timeouts
- RLS policy violations
