---
description: Create a new domain service following project conventions
---

1. Identify the domain entity (e.g., consignment, evidence, attestation, exception).
2. Create the service file at `src/services/<domain>Service.ts`.
3. The service MUST follow this structure:
   - Import supabase from `@/integrations/supabase/client`
   - Import logger from `@/utils/logger`
   - Import ServiceResult from `@/types/lot.types` (or the relevant types file)
   - Export a const object named `<domain>Service`
   - Every method returns `Promise<ServiceResult<T>>`
   - Every method has a try/catch block
   - On success: `logger.info('<domain>.<action>', { ...context })` then `return { success: true, data }`
   - On error: `logger.error('<domain>.<action>_failed', { ...context }, error)` then `return { success: false, error: error.message }`
4. Rules:
   - Never throw. All exceptions caught internally.
   - Never use console.log/error/warn. Use logger.
   - One service per domain. Do not combine domains.
   - Use RPC functions for multi-table atomic operations.
   - Use direct supabase queries for single-table reads.
5. After creating the service, create a corresponding test file at `src/__tests__/services/<domain>Service.test.ts`.
6. The test file MUST use `vi.hoisted()` for mock definitions:
   - `const { mockRpc, mockFrom } = vi.hoisted(() => ({ mockRpc: vi.fn(), mockFrom: vi.fn() }));`
   - `vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mockRpc, from: mockFrom } }));`
7. Add TypeScript interfaces for the new entity in `src/types/` if they do not already exist.
