---
description: Build or update consignment UI components following MVP design rules
---

1. All consignment UI lives under `src/components/consignment/` and `src/pages/consignment/`.
2. The main page is `/consignments/:id` with a 3-zone layout:
   - **Header** (fixed): consignment ID, exporter, destination, status, blocking count, last computed
   - **Central panel**: ReadinessHero, ScorecardGrid, ExceptionsPanel, EvidenceCoverageMatrix, AttestationList, CustodyTimeline, EvidencePackCard
   - **Right sidebar**: Quick actions (Add Evidence, Request Attestation, Recompute State, Export Pack, Verify Hash)
3. Design rules:
   - Use Inter font, light backgrounds, high-contrast cards
   - Semantic badges: Ready (green), Needs Review (amber), Blocked (red), Incomplete (gray)
   - No neon/blockchain aesthetics
   - Typography: H1 28-32, H2 20-24, H3 16-18, Body 14-16, Meta 12-13
4. Components to build (in order):
   - `ReadinessHero` — import/financing badges, blocking count, last updated
   - `ScorecardGrid` — 4 cards: evidence completeness, attribution strength, custody continuity, decision readiness
   - `ExceptionsPanel` — blocking first, warnings below, CTA to resolve
   - `EvidenceCoverageMatrix` — type, status, source, freshness, attestation link, gap flag
   - `AttestationList` — actor, claim, evidence, signed_at, status
   - `CustodyTimeline` — compact from/to, evidence linked, gap markers
   - `EvidencePackCard` — pack status, last generated, hash, anchor status, download
5. All components consume services via props or hooks. No direct Supabase calls in components.
6. Use shadcn/ui Card, Badge, Button, Table, Progress, Separator.
7. Use lucide-react for all icons.
