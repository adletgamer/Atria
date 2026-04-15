# Verifield — Google Factory X Moonshot Submission

**Deadline: April 19, 2026**

Use this document to fill in the Google Factory X submission form.
Copy each section directly into the corresponding field.

---

## Project Name

**Verifield**

---

## Tagline (one sentence)

The compliance layer for global produce trade — one hash, any customs, instantly verified.

---

## Problem Statement

$2.6 billion in perishable export shipments are rejected or delayed at customs every year because importers, banks, and regulators have no shared, verifiable record of whether a shipment is ready. Phytosanitary certificates live in one portal, lab reports arrive by email, and inspection signatures get lost on paper. There is no single source of truth — only uncertainty. For 320,000 smallholder farming families in Peru and Mexico, one 48-hour customs delay can mean a season's income lost.

---

## Solution

Verifield is a Consignment Readiness Engine. It groups all compliance documents for a shipment into a single case, validates them through a formal 6-state machine (draft → import_ready), and generates a cryptographically verifiable Evidence Pack: a SHA-256 Merkle root of all evidence, anchored immutably on Hedera Consensus Service.

Any importer, customs official, bank, or auditor can query this hash on the Hedera Mirror Node and verify readiness independently — no intermediary, no account, no phone call. Decision time drops from 72 hours to 3 minutes.

---

## How is this a Moonshot?

The global fresh produce export market is $1.5 trillion annually. 40% of post-harvest losses in perishables are caused by preventable delays. If every major perishable export corridor adopted a shared compliance verification protocol, the reduction in spoilage, rejected shipments, and idle working capital could unlock $240B+ in economic value — most of it flowing back to smallholder farmers and emerging-market exporters who currently bear the full cost of uncertainty.

Verifield is the TCP/IP layer for trade trust: an open, verifiable protocol that makes compliance certainty a commodity rather than a privilege.

---

## SDG Alignment

**Primary: SDG 2 — Zero Hunger**
Every hour of compliance delay is food that spoils instead of reaching consumers. Verifield reduces decision time from 72 hours to 3 minutes — turning a structural cause of food waste into a solved engineering problem.

**Secondary: SDG 1 — No Poverty**
Smallholder farmers cannot access pre-shipment financing because lenders cannot verify readiness without waiting weeks for documents. Verifield enables same-day financing release triggered by an anchored Evidence Pack hash.

---

## What's Built (Demo-Ready Today)

- **9 core protocol primitives** — fully implemented, production TypeScript
- **6-state formal state machine** — draft → evidence_collecting → docs_complete → treatment_attested → custody_continuous → import_ready → released
- **Import Readiness Decision Sentinel** — real-time go/no-go per consignment
- **Financing / Underwriting Panel** — second lens: evidence sufficiency score, custody continuity score, critical doc recency table, eligibility verdict
- **Public Verifier** at `/verify-pack` — no login required, live Hedera Mirror Node check
- **Hedera HCS anchoring** — live on testnet, topic 0.0.8535355, Merkle root anchoring
- **MangoChainRegistry.sol** — Solidity 0.8.20, deployed on Polygon Amoy
- **44 integration test assertions** — TypeScript strict, Vitest
- **Row Level Security** — 17-actor access model enforced at Supabase DB level
- **7 demo consignment cases** — all states, with real evidence, attestations, exceptions

**Live demo accounts:**

| Role | Email | Password |
|------|-------|----------|
| Export Manager | exportmanager@harvestlink.demo | HarvestLink2026! |
| Compliance Lead | compliance@harvestlink.demo | HarvestLink2026! |
| Auditor | auditor@harvestlink.demo | HarvestLink2026! |

---

## What We'll Build During the Hackathon (Apr 18 – May 10)

**Week 1:** Deploy Verifield to Vercel production · Migrate Hedera key to Supabase Edge Function · First contact with Piura exporter partners

**Week 2:** SENASA/SUNAT API integration research · Build lender verification REST API · Draft term sheet with 1 financing partner

**Week 3:** First real Evidence Pack anchored on Hedera mainnet · Pitch to Google Factory X judges · Incorporate feedback for Phase 1 pilot

---

## Team

**Alex** — TKS (The Knowledge Society) & Velocity program

- Full-stack engineer: React 18, TypeScript, Supabase, Hedera SDK
- Blockchain: Solidity 0.8.20, Wagmi v2, Polygon Amoy deployment
- Domain research: SENASA, SUNAT, Peruvian mango export corridors, trade finance
- Built this in 3 weeks as a solo sprint during the TKS/Velocity track

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/ui |
| Backend | Supabase (PostgreSQL + RLS + Edge Functions) |
| Anchoring | Hedera HCS — Consensus Service + Mirror Node API |
| Smart contract | Solidity 0.8.20 · MangoChainRegistry · Polygon Amoy |
| Wallet | Wagmi v2 + Viem + RainbowKit |
| Testing | Vitest · 44 assertions · TypeScript strict mode |

---

## Focus Project

**Verifield** — submitted as the Focus Project for the Google Factory X Moonshot track.

This is the project we will work on exclusively during the April 18 – May 10 hackathon sprint.

---

## Links

- **GitHub:** https://github.com/adletgamer/mango-rastreo-chain
- **Demo (verify-pack):** /verify-pack — type `CS-2026-001` to see a live Hedera-verified pack
- **Pitch deck:** `Verifield_Moonshot_Pitch.pptx` (10 slides, included in repository)
- **Roadmap:** `docs/ROADMAP.md`

---

*Verifield — Built at TKS & Velocity · Google Factory X Moonshot 2026*
