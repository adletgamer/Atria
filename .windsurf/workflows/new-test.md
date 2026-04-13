---
description: Create a new Vitest test file for a service
auto_execution_mode: 0
---

1. Identify the service to test (e.g., `consignmentService`).
2. Create the test file at `src/__tests__/services/<service>.test.ts`.
3. The test file MUST start with hoisted mocks:

```
const { mockRpc, mockFrom } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mockRpc, from: mockFrom },
}));
```

4. Structure:
   - `describe("<serviceName>")` at top level
   - `beforeEach(() => vi.clearAllMocks())`
   - One `describe` block per method
   - Test cases: success path, error path, edge cases
5. Mock patterns:
   - For RPC calls: `mockRpc.mockResolvedValue({ data: ..., error: null })`
   - For query chains: `mockFrom.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), ... })`
   - For insert: `mockFrom.mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ data: null, error: null }) })`
6. Run tests:
// turbo
7. `npx vitest run --reporter=verbose`
