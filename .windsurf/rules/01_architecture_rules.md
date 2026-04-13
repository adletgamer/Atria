# Architecture Rules

- Single runtime, single source of truth (Supabase PostgreSQL).
- Core unit is ConsignmentCase, not just Lot.
- Blockchain is only for commitments and anchors. No data on-chain.
- Sensitive evidence must remain off-chain (Supabase Storage).
- Build one MVP with two views: compliance and financing.
- Do not create parallel V2 pages or duplicate services.
- Every new feature must map to one of:
  - EvidenceObject
  - Attestation
  - Exception
  - StateSnapshot
  - EvidencePack
- Atomic transactions via RPC functions. No multi-step client inserts.
- Append-only events: lot_events, consignment_events, state_transitions.
- EAV pattern for variable instance data (lot_attributes, evidence_objects).
- All services return ServiceResult<T>. Services never throw.
