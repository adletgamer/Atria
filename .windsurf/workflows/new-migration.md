---
description: Create a new Supabase SQL migration file
---

1. Generate a timestamp in format `YYYYMMDDHHMMSS` based on current date/time.
2. Create the file at `supabase/migrations/<timestamp>_<description>.sql`.
3. The migration MUST include:
   - Table creation with all columns, types, defaults, and constraints.
   - `ENABLE ROW LEVEL SECURITY` for every new table.
   - RLS policies (SELECT, INSERT, UPDATE) in the same file.
   - Relevant indexes for foreign keys and frequent query patterns.
   - Comments explaining each section.
4. If creating RPC functions, use `CREATE OR REPLACE FUNCTION` with `SECURITY DEFINER` where appropriate.
5. If creating triggers, name them `trigger_<action>_<table>`.
6. After writing the migration, remind the user to run:
// turbo
7. `npx supabase db push` or apply via Supabase dashboard SQL editor.
8. Update `src/types/` if new TypeScript interfaces are needed for the new tables.
