# No Hype Rules

Do not introduce technology because it is trendy.

## Do Not Add (unless explicitly tied to a current-stage user problem)

- x402
- AP2
- UCP
- A2A
- Tokenization
- Consumer wallet UX
- IPFS as primary storage
- Public trust score
- Marketplace features
- Multi-crop expansion

## FROZEN — Do Not Build Now

These are explicitly out of scope for the current stage:

- **Consumer scan flow** as a priority (the product serves exporters and compliance reviewers, not end consumers)
- **Tokenization** of consignments or evidence
- **Lender marketplace** or financing marketplace UI
- **Multi-chain UX** (single backend signer, no chain selection for users)
- **Mobile app** (web-first, responsive is fine)
- **Vanity dashboards** (no decorative charts, trust scores, or activity feeds that don't answer "can I defend this consignment?")
- **Tracking timeline as primary narrative** (timeline exists but is subordinate to state + exceptions + completeness)
- **Wallet language in main flow** (no "connect wallet", "sign", "tx", "network" visible to the primary user)

## Justify Every Major Addition By

- User need (who needs this and why)
- Product wedge (how does this differentiate)
- Architectural necessity (does the system break without it)

## Smart Wallet Decision

- YES to backend-first system signer
- NO to wallet UX for export managers in MVP
- LATER: reviewer smart wallet, underwriter verification wallet

## UI Priority Order

The UI must prioritize (in this order):

1. **State** — current operational state of the consignment
2. **Exceptions** — blocking and warning issues
3. **Completeness** — evidence present vs required (count, not %)
4. **Continuity** — custody gaps (count, not score)
5. **Missing critical evidence** — what's absent
6. **Decision readiness with reasons** — can this consignment be defended?

Scores (0-100%) are **secondary indicators**, never the hero element.
