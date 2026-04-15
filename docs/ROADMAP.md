# Verifield Protocol — Product Roadmap

**The compliance layer for global produce trade.**

> Last updated: April 2026 · Status: v2.0 built · Submitted to Google Factory X Moonshot

---

## Where We Are Today (v2.0 — April 2026)

Verifield is a production-ready Consignment Readiness Engine. Every feature below is shipped, tested, and running against a live Supabase backend with Hedera HCS anchoring on testnet.

| Primitive | Status | Description |
|-----------|--------|-------------|
| LotIdentity | ✅ Live | Harvest, GPS, variety, farm actor |
| ConsignmentCase | ✅ Live | Groups lots for a destination, formal state machine |
| StateTransition | ✅ Live | Validated atomic transitions with actor + evidence refs |
| Attestation | ✅ Live | Qualified signatures from 17 protocol actor types |
| EvidenceObject | ✅ Live | SHA-256 content hash, Supabase Storage, immutable record |
| CustodyTransfer | ✅ Live | Chain-of-custody handoffs with gap detection |
| StateSnapshot | ✅ Live | Computed readiness score + risk status |
| Anchor | ✅ Live | Hedera HCS testnet · topic 0.0.8535355 |
| EvidencePack | ✅ Live | SHA-256 Merkle root, versioned, anchored |

**What judges and evaluators can verify today:**

- 7 demo consignment cases across all 6 formal states
- Import Readiness Decision Sentinel (go/no-go in real time)
- Financing / Underwriting Readiness Panel (second lens, same engine)
- Public verifier at `/verify-pack` — no login required
- 44 integration tests, TypeScript strict, zero stub pages
- Hedera Mirror Node verification for any anchored pack hash

---

## Phase 1 — Pilot (April – July 2026)

**Goal:** First real shipment with real documents, real actors, real money.

### 1.1 Production Infrastructure

| Task | Priority | Effort |
|------|----------|--------|
| Move `VITE_HEDERA_OPERATOR_KEY` to Supabase Edge Function | Critical | 2 days |
| Deploy MangoChainRegistry to Polygon mainnet | High | 1 day |
| Supabase production project (separate from demo) | High | 1 day |
| Vercel production deployment with env secrets | High | 0.5 days |
| Basic monitoring (Supabase Logs + Hedera Mirror Node alerts) | Medium | 1 day |

### 1.2 Pilot Partner Integration

| Task | Priority | Effort |
|------|----------|--------|
| Onboard 2 exportadora partners in Piura, Peru | Critical | 2 weeks |
| Add actor onboarding flow (invite by email, role assignment) | High | 3 days |
| SENASA inspection data import (CSV/API bridge) | High | 1 week |
| SUNAT customs clearance status webhook | High | 1 week |
| Real phytosanitary certificate upload + hash verification | High | 2 days |

### 1.3 Evidence & Attestation Improvements

| Task | Priority | Effort |
|------|----------|--------|
| PDF text extraction + auto-classification by doc type | Medium | 3 days |
| QR code on Evidence Pack for customs desk scanning | Medium | 1 day |
| Bulk evidence upload (ZIP → auto-unpack + hash) | Medium | 2 days |
| Email notification when attestation is requested | Medium | 1 day |

### 1.4 Financing Pilot

| Task | Priority | Effort |
|------|----------|--------|
| Financing readiness score exposed via REST API (for lender) | Critical | 2 days |
| Lender verification portal (read-only, no login required) | High | 3 days |
| Webhook: notify lender when `import_ready` state reached | High | 1 day |
| PDF export of Evidence Pack summary for underwriter | Medium | 2 days |

**Phase 1 Exit Criteria:** ≥1 real shipment with all documents anchored, financing partner can verify readiness via API without calling the exporter.

---

## Phase 2 — Scale (August – December 2026)

**Goal:** 10 exporters, 3 markets, first revenue.

### 2.1 Protocol Expansion

| Feature | Description |
|---------|-------------|
| Multi-commodity support | Avocado (Mexico), blueberry (Chile), flower (Colombia) — same primitives, different actor sets |
| Multi-destination compliance | US CBP requirements vs EU phytosanitary vs UK post-Brexit rules |
| Custom exception rules | Each importer can configure their own blocking conditions |
| Batch consignment grouping | Multiple containers under one master consignment |

### 2.2 Financing Layer

| Feature | Description |
|---------|-------------|
| Financing readiness score API (bank-grade) | Structured JSON response with score, breakdown, and verification link |
| Pre-shipment credit release trigger | Smart contract that releases credit when `import_ready` state is anchored |
| Letter of Credit automation | Generate LC draft from Evidence Pack metadata |
| Insurance underwriting report | Standard format for trade credit insurers |

### 2.3 Integrations

| Integration | Status | Impact |
|-------------|--------|--------|
| SUNAT (Peru customs) | Planned | Eliminates manual customs declaration |
| SENASA (Peru phytosanitary) | Planned | Auto-imports inspection certificates |
| US CBP ACE | Planned | Pre-arrival declaration from Evidence Pack |
| SICE (Ecuador) | Backlog | Regional expansion |
| AgriDigital | Backlog | Grain supply chain integration |

### 2.4 Business Model Activation

| Revenue stream | Pricing | Notes |
|----------------|---------|-------|
| Protocol fee per anchored shipment | $8–12 / consignment | Charged at `import_ready` transition |
| Lender API access | $500–2000 / month | Per financing institution |
| Compliance SaaS | $200–800 / month | For exporters with >50 shipments/year |
| White-label protocol | Custom | For national trade bodies (PROMPERU, ASERCA) |

**Phase 2 Exit Criteria:** $10K MRR, 10 active exporters, 1 integrated financing partner releasing pre-shipment credit.

---

## Phase 3 — Ecosystem (2027+)

**Goal:** Open protocol. Any commodity. Any country. Permissionless verification.

### 3.1 Open Protocol

- Publish Verifield Protocol Specification (VPS v1.0) under open license
- SDK for exporters to self-integrate without Verifield SaaS
- Public API for customs authorities to verify any pack hash
- Protocol DAO governance for threshold standards (evidence requirements, actor types)

### 3.2 DeFi Trade Finance Layer

- Stablecoin-backed pre-shipment lending against anchored Evidence Packs
- Smart contract escrow: funds released when import_ready state is verified on-chain
- Secondary market for trade receivables backed by Verifield proofs
- Integration with protocols: Goldfinch, Centrifuge, TradeFi

### 3.3 Global Expansion

| Market | Entry Vector | Key Integration |
|--------|-------------|-----------------|
| Peru → Mexico | Avocado exporters | SENASICA, SAT |
| Peru → Colombia | Flower exporters | ICA, DIAN |
| LATAM → EU | Organic certification | EU Entry Documents, TRACES |
| LATAM → US | Food Safety | US FDA, CBP ACE |
| Southeast Asia | Fruit exports | ASEAN Customs Portal |

### 3.4 Scale Targets

| Metric | 2026 | 2027 | 2028 |
|--------|------|------|------|
| Shipments anchored / year | 500 | 10,000 | 100,000 |
| Active exporters | 10 | 150 | 2,000 |
| Countries | 2 | 5 | 15 |
| Protocol revenue | $50K | $1.5M | $12M |
| Pre-shipment financing facilitated | $500K | $15M | $150M |

---

## Technical Debt & Security Backlog

These are tracked and prioritized. None are blockers for the pilot, but all must be resolved before mainnet scale.

| Item | Severity | Sprint |
|------|----------|--------|
| VITE_HEDERA_OPERATOR_KEY → Edge Function | Critical | Phase 1, Week 1 |
| RLS policy audit (external security review) | High | Phase 1, Month 2 |
| Rate limiting on public `/verify-pack` endpoint | High | Phase 1, Month 2 |
| Input sanitization on all text fields | Medium | Phase 1, Month 1 |
| Supabase realtime subscriptions (replace polling) | Medium | Phase 2 |
| End-to-end Cypress tests for critical flows | Medium | Phase 2 |
| Solidity contract audit (MangoChainRegistry) | High | Before mainnet |
| CSP headers + HSTS on Vercel deployment | Medium | Phase 1, Week 2 |

---

## Immediate Next Steps (Hackathon Sprint: April 18 – May 10)

These are the specific actions for the Google Factory X Moonshot sprint:

1. **Week 1 (Apr 18–25):** Deploy to Vercel production · Move Hedera key to Edge Function · Onboard first pilot exporter contact
2. **Week 2 (Apr 25 – May 2):** SENASA API research · Build lender verification portal · Draft financing partner outreach
3. **Week 3 (May 2–9):** First real Evidence Pack anchored · Present to Google Factory X judges · Incorporate feedback

---

*Verifield Protocol — Built at TKS & Velocity · Google Factory X Moonshot 2026*
