# ATRIA

**Verifiable supply-chain compliance for perishable exports — from farm to customs, anchored on Hedera.**

> Built at TKS & Velocity · Submitted to Google Factory X Moonshot · SDG 1 · SDG 2 · SDG 12 · SDG 17

[![Hedera](https://img.shields.io/badge/Hedera-HCS%20Testnet-3d3d3d)](https://hedera.com)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy%20Testnet-7b3fe4)](https://polygon.technology)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)](https://typescriptlang.org)

---

## The Problem

Each year, $2.6 billion in fresh produce is rejected or delayed at customs because importers and regulators cannot quickly verify whether an export shipment has all required documentation, certifications, cold-chain continuity, and inspection approvals. For smallholder farmers in Peru and Mexico, a single delay can mean a spoiled harvest and a season's income lost.

Existing systems are fragmented: phytosanitary certificates live in one portal, lab reports in another, inspection sign-offs in email threads. There is no shared, tamper-evident record of a shipment's readiness. The result is uncertainty — and uncertainty stops trade.

---

## The Solution

ATRIA is a **consignment readiness engine**: it groups all evidence objects for a shipment into a single case, tracks formal state transitions through a verified pipeline, and generates a cryptographically verifiable **Evidence Pack** — a SHA-256 Merkle root of all compliance documents — anchored immutably on Hedera Consensus Service.

Anyone — importer, customs official, trade financier, auditor — can independently verify a shipment's readiness by querying the Hedera Mirror Node with nothing but the pack hash.

**Decision in minutes, not days.**

---

## Live Demo

| Role | Email | Password |
|------|-------|----------|
| Export Manager | `exportmanager@harvestlink.demo` | `HarvestLink2026!` |
| Compliance Lead | `compliance@harvestlink.demo` | `HarvestLink2026!` |
| Auditor (read-only) | `auditor@harvestlink.demo` | `HarvestLink2026!` |

### 5-Minute Judge Flow

1. **`/verify-pack`** — no login required. Type `CS-2026-001` to see a live verification report with Hedera proof.
2. **`/overview`** — login as Export Manager. Real-time KPIs from Supabase.
3. **`/consignments` → CS-2026-001** — full workbench: evidence matrix, attestations, custody timeline, Decision Sentinel (✅ Import Ready).
4. **`/consignments` → CS-2026-003** — two blocking exceptions (missing phyto cert + cold chain deviation). Decision Sentinel: ❌ Not Ready.
5. **`/readiness`** — pipeline view across all 7 demo cases.
6. **`/analytics`** — state distribution + evidence breakdown charts.

---

## How It Works

### The 9 Primitives

```
1. LotIdentity         — individual mango lot (harvest, GPS, variety)
2. ConsignmentCase     — groups one or more lots for a destination
3. StateTransition     — formal state change with actor + evidence refs
4. Attestation         — qualified or platform signature from any actor
5. EvidenceObject      — immutable document with SHA-256 content hash
6. CustodyTransfer     — chain-of-custody handoff record
7. StateSnapshot       — computed readiness score + risk status
8. Anchor              — on-chain hash record (Hedera HCS)
9. EvidencePack        — Merkle root of all evidence hashes (anchored)
```

### Formal State Machine

```
draft
  └─► evidence_collecting
        └─► docs_complete
              └─► treatment_attested
                    └─► custody_continuous
                          └─► import_ready  ──► [Evidence Pack anchored on Hedera]
                                └─► released
```

Any blocking exception at any stage halts progression. The **Decision Sentinel** renders the go/no-go verdict in real time.

### Architecture

```
Browser (React + Viem)       Supabase (off-chain)       Hedera HCS (on-chain)
──────────────────────       ────────────────────       ─────────────────────
Consignment Workbench  ──►  consignment_cases      ──►  trust_proofs
Evidence Upload        ──►  evidence_objects             (pack_hash only)
Attestation Request    ──►  consignment_attestations
Exception Resolution   ──►  consignment_exceptions
Pack Generation        ──►  [SHA-256 Merkle root] ──►  Hedera topic 0.0.XXXXXXX
Public Verification    ◄──  Mirror Node API             (anyone, no login)

                            Polygon Amoy (optional)
                            MangoChainRegistry.sol
                            verifyHash(bytes32) → bool
```

**Key design principle:** Nothing sensitive goes on-chain. Only SHA-256 hashes of aggregated evidence packs are anchored. All raw documents, PII, and operational data stay in Supabase with Row Level Security.

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/ui |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL + RLS policies) |
| Blockchain (hash anchoring) | Hedera HCS — Consensus Service |
| Blockchain (smart contract) | MangoChainRegistry.sol — Polygon Amoy (Solidity 0.8.20) |
| Wallet | Wagmi v2 + Viem + RainbowKit |
| Charts | Recharts |
| Testing | Vitest + Testing Library |

---

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env.local
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
# For Hedera (optional, testnet only): VITE_HEDERA_TOPIC_ID, VITE_HEDERA_OPERATOR_ID, VITE_HEDERA_OPERATOR_KEY
```

### 2. Install and run

```bash
npm install
npm run dev
# App available at http://localhost:8080
```

### 3. Seed demo data

```bash
# Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
npm run seed:demo
# Creates: 3 demo users, 1 org, 7 consignment cases, evidence, attestations, exceptions
```

### 4. Deploy smart contract (optional)

```bash
npm run contracts:compile
npm run contracts:deploy
# Updates VITE_REGISTRY_CONTRACT_ADDRESS in your deployment config
```

---

## SDG Impact

| SDG | Connection |
|-----|-----------|
| **SDG 1 — No Poverty** | Smallholder farmers in Peru and Mexico gain access to pre-shipment financing because lenders can now verify the readiness of a pending harvest in real time — without waiting for documents to clear. |
| **SDG 2 — Zero Hunger** | Reducing decision uncertainty from days to minutes cuts spoilage in perishable supply chains. Every hour saved is produce that reaches consumers instead of landfill. |
| **SDG 12 — Responsible Consumption** | Importers and retailers get a verifiable, tamper-evident audit trail of every document, inspection, and custody transfer — enabling truly informed sourcing. |
| **SDG 17 — Partnerships** | A 17-actor protocol (exporter, importer, inspector, customs, financier, transporter, certifier, and more) with a shared, authoritative record enables coordination that was previously impossible without a trusted intermediary. |

---

## Security Model

- **Row Level Security** — all Supabase queries are scoped to organization participants; direct table access is blocked for anonymous users.
- **Content hashing** — evidence files are SHA-256 hashed client-side before upload; the hash is the canonical identifier.
- **No private keys on-chain** — only hash commitments are published to Hedera; no PII, no documents, no metadata.
- **Production Hedera key** — `VITE_HEDERA_OPERATOR_KEY` is intentionally disabled in production builds (see `src/config/hedera.ts`). The production path uses a Supabase Edge Function where the key is stored as a server-side secret.
- **Solidity contract** — `MangoChainRegistry.sol` (single active contract, `^0.8.20`, `viaIR` optimizer). All legacy contracts are deprecated.

---

## Project Structure

```
src/
├── components/
│   └── consignment/        # Workbench, Evidence Matrix, Decision Sentinel
├── config/
│   └── hedera.ts           # HCS config + security guard
├── pages/
│   ├── Consignments.tsx    # Main workbench router
│   ├── Readiness.tsx       # Pipeline view
│   ├── Analytics.tsx       # Operational metrics
│   ├── Evidence.tsx        # Evidence repository
│   └── Rastrear.tsx        # Public lot/case lookup
├── services/
│   ├── evidenceService.ts  # SHA-256, Merkle root, Evidence Pack (Primitive 9)
│   ├── hederaService.ts    # HCS submission + Mirror Node verification
│   ├── consignmentService.ts
│   └── complianceService.ts
└── __tests__/
    └── services/           # Vitest integration tests
contracts/
└── MangoChainRegistry.sol  # Single active smart contract
scripts/
├── seed-demo.ts            # Demo data seeder (npm run seed:demo)
└── deploy.cjs              # Contract deployer (npm run contracts:deploy)
docs/
└── DEMO_ACCOUNTS.md        # Judge / evaluator guide
```

---

*ATRIA — Built at TKS & Velocity*  
*Google Factory X Moonshot Submission — 2026*
