# UI Design Principles — Consignment Readiness Engine

## Core Thesis

**Export compliance workstation, not web3 app.**

This is an institutional B2B tool for export managers and compliance leads to answer:
> "Can I defend this consignment to a third-party reviewer?"

## Visual References

**DO** look like:
- Notion (clean hierarchy, density)
- Stripe Dashboard (institutional, serious)
- Linear (functional, minimal)
- Supabase Studio (data-first, no fluff)

**DO NOT** look like:
- Crypto wallets
- DeFi dashboards
- Blockchain explorers
- Consumer tracking apps

## Typography

**Font**: Inter (fallback: ui-sans-serif, system-ui)

**Scale**:
- Page title: `text-2xl font-semibold`
- Section title: `text-lg font-semibold`
- Card title: `text-sm font-medium`
- Body: `text-sm`
- Meta: `text-xs text-muted-foreground`

**Density**: Professional, compressed enough for real work, not overly airy.

## Color Semantics

**Base**:
- Light background or soft neutral dark
- Cards with thin borders
- Minimal shadows

**Semantic**:
- Green = ready
- Amber = warning
- Red = blocking
- Blue = attested / anchored
- Gray = incomplete / unknown

**NO**:
- Web3 gradients
- Glassmorphism
- Neon accents
- Rainbow progress bars

## Iconography

**Library**: Lucide React

**Use sparingly** for:
- Readiness status
- Exception severity
- Upload/verify/anchor actions
- Share/download

**Never** for:
- Decorative elements
- Every list item
- Vanity stats

## Visual Priority Order

The UI must prioritize (in this exact order):

1. **State** — current operational state of the consignment
2. **Exceptions** — blocking and warning issues
3. **Completeness** — evidence present vs required (count, not %)
4. **Continuity** — custody gaps (count, not score)
5. **Missing critical evidence** — what's absent
6. **Decision readiness with reasons** — structured justification

**Scores (0-100%) are secondary indicators**, never the hero element.

## Component Hierarchy

### Primary Components (always visible)
- ConsignmentHeader
- ReadinessHero (with decision contexts)
- ScorecardGrid (state-centric)
- ExceptionsPanel (blocking first)
- EvidenceCoverageMatrix

### Secondary Components (contextual)
- AttestationList
- EvidencePackCard
- CustodyTimeline (demoted, below pack)
- QuickActions (sidebar)

### Tertiary Components (dialogs)
- AddEvidenceDialog
- RequestAttestationDialog
- GeneratePackDialog

## Layout Structure

### Top Bar
- Logo
- Environment badge (dev/staging)
- User role
- Org selector (if applicable)

### Sidebar
- Consignments
- Evidence
- Exceptions
- Packs
- Audit
- Settings

### Main Content
- Left: Workbench + lists (70%)
- Right: Summary rail (30%)

### Header (per consignment)
- Consignment ID
- Route (origin → destination)
- Exporter
- Status chip
- Last updated
- Anchor status

## What to ELIMINATE Immediately

If any of these exist, remove them:

- ❌ Web3 gradients
- ❌ Useless graphs
- ❌ Wallet chip as protagonist
- ❌ Network selector visible to core user
- ❌ "Blockchain verified" marketing badges
- ❌ Timeline as hero component
- ❌ Vanity stats cards
- ❌ Trust score as primary metric
- ❌ Activity feed that doesn't answer decision questions

## Empty States

Every list/table must have a clear empty state:

```
[Icon]
No [items] yet
[Brief explanation]
[Primary CTA button]
```

Example:
```
📦 No evidence attached yet
Upload documents to begin building the evidence pack
[+ Add Evidence]
```

## Toast Notifications

Use for:
- Evidence uploaded
- Attestation requested
- Exception resolved
- Pack generated
- Anchor confirmed

**Format**: `[Action] [Status] — [Detail]`

Example: `Evidence uploaded — phytosanitary_cert.pdf (2.3 MB)`

## Breadcrumbs

Always show path for nested views:

`Consignments / CS-2026-001 / Evidence`

## Decision Mode Selector

Segmented control (not tabs):
- Import Readiness
- Underwriting Readiness

Same data, different lens. Not separate products.

## Data Tables

**Columns** (in order):
1. Type/ID
2. Status
3. Source/Actor
4. Freshness/Date
5. Actions

**NO**:
- Decorative columns
- Redundant data
- Pagination if <100 rows (show all)

## Badges

**Size**: Small, inline
**Style**: Outlined or subtle fill
**Text**: Uppercase or sentence case (consistent)

**Types**:
- Status: `draft | pending | ready | blocked`
- Severity: `info | warning | critical | blocking`
- Pack: `not_generated | stale | fresh | anchored`
- Readiness: `ready | not_ready`

## Buttons

**Primary**: Solid, high contrast (generate pack, recompute state)
**Secondary**: Outlined (add evidence, request attestation)
**Destructive**: Red outlined (resolve exception, delete)

**NO**:
- Gradient buttons
- Animated buttons
- Icon-only buttons without tooltip

## Spacing

**Consistent scale**:
- Section gap: `gap-6`
- Card gap: `gap-4`
- List item gap: `gap-2`
- Inline gap: `gap-1.5`

## Responsive

**Mobile**: Not a priority, but must be usable
**Desktop**: Primary target (1440px+)
**Tablet**: Secondary (1024px)

## Accessibility

- All interactive elements keyboard-navigable
- Color not the only indicator
- Alt text for icons
- ARIA labels for screen readers

## Performance

- No unnecessary animations
- Lazy load large lists
- Debounce search inputs
- Optimistic UI updates

## Consistency

**Every component must answer**:
1. Does this help make a decision?
2. Does this show missing/critical evidence?
3. Does this reduce uncertainty or add noise?
4. Does it avoid crypto aesthetics?
5. Is it consistent with compliance/import-readiness tools?
