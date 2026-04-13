# Frontend System

## Routes

| Route | Purpose |
|-------|---------|
| `/consignments` | List all consignment cases |
| `/consignments/:id` | Main consignment detail (3-zone layout) |
| `/consignments/:id/evidence` | Evidence management |
| `/consignments/:id/readiness` | Readiness scorecard (import + financing tabs) |
| `/consignments/:id/pack` | Evidence pack generation and download |
| `/consignments/:id/verify` | Pack hash verification |

## Eliminated from Focus

- `/marketplace` — not MVP
- Consumer-first pages — not MVP
- Wallet dashboard — not MVP

## Page Layout: /consignments/:id

### Zone 1: Header (fixed)
- Consignment ID + public reference
- Exporter name
- Destination market + country
- Current status badge
- Blocking exceptions count (red if > 0)
- Last computed timestamp

### Zone 2: Central Panel (scrollable)
1. ReadinessHero — import/financing badges, blocking count
2. ScorecardGrid — 4 metric cards
3. ExceptionsPanel — blocking first, warnings below
4. EvidenceCoverageMatrix — evidence grid with gap flags
5. AttestationList — attributed claims
6. CustodyTimeline — compact chain with gap markers
7. EvidencePackCard — pack status, hash, download

### Zone 3: Right Sidebar (fixed)
Quick actions:
- Add Evidence
- Request Attestation
- Recompute State
- Export Pack
- Verify Pack Hash

## Component Hierarchy

```
ConsignmentDetailPage
  ConsignmentHeader
  main (grid: central + sidebar)
    central
      ReadinessHero
      ScorecardGrid
      ExceptionsPanel
      EvidenceCoverageMatrix
      AttestationList
      CustodyTimeline
      EvidencePackCard
    sidebar
      QuickActions
```

## Data Flow

Pages call hooks. Hooks call services. Services call Supabase.
Components receive data via props. No direct Supabase calls in components.
