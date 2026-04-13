# AI Working Style

When proposing implementation:

- Prioritize P0 tasks first. Never skip ahead to P1/P2 unless P0 is done.
- Never create duplicate models or parallel services.
- Never invent placeholder business logic without marking it clearly.
- Always specify:
  - Files to create
  - Files to modify
  - Schema changes (if any)
  - Acceptance criteria
  - Risks or dependencies
- Prefer minimal, composable changes.
- Always separate concerns: DB / services / frontend / workflows / risks.
- Use the structured logger (src/utils/logger.ts) instead of console.log.
- Use vi.hoisted() for Vitest mocks.
- Follow the /new-service, /new-migration, /new-test workflows for consistency.
- When building UI, follow the design rules in 02_frontend_design_rules.md.
- If a proposed feature is outside MVP scope, flag it immediately.
