---
description: Implement Stage 2 core data model and services for the Consignment Readiness Engine
---

1. Verify Stage 2 migrations exist in `supabase/migrations/`:
   - `20260327100000_create_consignment_schema.sql`
   - `20260327200000_primitives_and_anchoring.sql`
   - `20260327300000_custody_actors_snapshots.sql`
2. If missing, create them following /new-migration workflow.
3. Create or verify TypeScript types in `src/types/consignment.types.ts`:
   - ConsignmentCase, ConsignmentLot, EvidenceObject, Attestation, Exception, StateSnapshot, Actor, ActorRole
4. Create or verify services (each following /new-service workflow):
   - `consignmentService.ts` — CRUD for consignment_cases + lot association
   - `evidenceService.ts` — upload, attach, list evidence objects
   - `attestationService.ts` — create, list, revoke attestations
   - `exceptionService.ts` — create, resolve, ignore, list exceptions
   - `stateEngineService.ts` — computeConsignmentState(), persist snapshot
   - `evidencePackService.ts` — generate, serialize, hash pack
   - `signerService.ts` — signSnapshot, signEvidencePack, verifyAnchor
5. Create tests for each service following /new-test workflow.
6. Execution order: consignment → evidence → attestation → exception → stateEngine → evidencePack → signer.
7. Each step is a vertical slice: migration + types + service + tests.
