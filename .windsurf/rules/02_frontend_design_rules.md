# Frontend Design Rules

## Aesthetic

The UI must feel like a B2B decision system, not a crypto dashboard.

- Institutional, serious, minimalist, legible, high-contrast, audit-oriented.
- Prioritize clarity, hierarchy, and exception visibility.
- Show state, evidence, and blockers before any chart.
- Build around consignment-centric workflows.

## Do Use

- Light/near-white backgrounds
- Clean cards with clear borders
- Semantic badges (Ready, Needs Review, Blocked, Incomplete)
- Semantic chips (documented, attested, missing, expired)
- Strong typographic hierarchy
- Inter as primary font
- Horizontal bars for completeness
- Small donuts for readiness
- Exception counters

## Do Not Use

- Neon/blockchain aesthetics
- Excessive gradients
- Playful UI patterns
- Marketing-style area charts
- Charts without associated decisions
- Decorative animations

## Typography Scale

- H1: 28-32px
- H2: 20-24px
- H3: 16-18px
- Body: 14-16px
- Metadata: 12-13px

## Component Library

- React + TypeScript + Vite
- TailwindCSS for styling
- shadcn/ui for components
- lucide-react for icons
- Inter font via Google Fonts or local
