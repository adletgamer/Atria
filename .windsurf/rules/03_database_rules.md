# Database Rules

- Supabase Postgres is the operational source of truth.
- Supabase Storage is the primary evidence store.
- IPFS is NOT the primary storage layer (deferred to P2).
- Every evidence object must have: type, source, hash, timestamp, visibility.
- Every state snapshot must be reproducible from underlying evidence and rules.
- Migrations live in supabase/migrations/ with YYYYMMDDHHMMSS naming.
- Every new table must have ENABLE ROW LEVEL SECURITY.
- RLS policies must be in the same migration that creates the table.
- Append-only tables (lot_events, consignment_events, state_transitions): no UPDATE/DELETE policies.
- Use RPC functions with SECURITY DEFINER for cross-table atomic operations.
- Legacy migrations live in src/legacy/ — never reference them in new code.
