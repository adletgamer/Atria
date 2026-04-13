---
description: Run an architectural review to detect scope violations and duplication
---

1. Check for model violations:
   - Search for any service that does NOT return `ServiceResult<T>`
   - Search for any `console.log` or `console.error` in `src/services/` (should use logger)
   - Search for any import from `@/services/batchService` or `@/hooks/useScanTracking` in non-legacy code
   - Search for `DEMO_` prefixed data in runtime code
   - Search for `localStorage` usage for business data (not lang/wallet/session)
2. Check for duplication:
   - Look for parallel V2 pages (two versions of the same screen)
   - Look for duplicate service methods across services
   - Look for duplicate type definitions
3. Check for scope violations:
   - Flag any marketplace features
   - Flag any consumer scan features
   - Flag any wallet UX features
   - Flag any IPFS-as-primary-storage
   - Flag any x402/AP2/UCP/A2A references
4. Check for missing patterns:
   - Every new table should have RLS enabled
   - Every service should use logger
   - Every append-only table should have no UPDATE/DELETE policies
5. Output a summary with:
   - Violations found (with file:line references)
   - Recommendations
   - Risk level (critical, warning, info)
