# HarvestLink Protocol — Demo Accounts & Test Data

This document describes the demo accounts and test data for evaluators, judges, and reviewers.

---

## Quick Start

**App URL:** Configure your Supabase + Vercel deployment, or run locally with `npm run dev`

**Seed the database first:**
```bash
# Requires SUPABASE_SERVICE_ROLE_KEY in your .env.local
npx ts-node scripts/seed-demo.ts
```

---

## Demo Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Export Manager** | `exportmanager@harvestlink.demo` | `HarvestLink2026!` | Full: create consignments, upload evidence, request attestations |
| **Compliance Lead** | `compliance@harvestlink.demo` | `HarvestLink2026!` | Full + resolve exceptions, generate evidence packs |
| **Auditor** | `auditor@harvestlink.demo` | `HarvestLink2026!` | Read-only: view all consignments, evidence, attestations |

---

## Demo Consignment Cases

After running the seed script, these 7 cases will be available:

| Case Number | State | Country | Completeness | Notes |
|-------------|-------|---------|-------------|-------|
| **CS-2026-001** | `import_ready` | 🇺🇸 US | 96% | ✅ Anchored on Hedera — best demo case |
| **CS-2026-002** | `custody_continuous` | 🇳🇱 Netherlands | 88% | In transit, evidence fresh |
| **CS-2026-003** | `exception_flagged` | 🇨🇦 Canada | 62% | ❌ 2 blocking exceptions (missing phyto cert + temp deviation) |
| **CS-2026-004** | `docs_complete` | 🇬🇧 UK | 81% | Awaiting inspection |
| **CS-2026-005** | `evidence_collecting` | 🇺🇸 US | 35% | Early stage, 1 warning exception |
| **CS-2026-006** | `released` | 🇩🇪 Germany | 100% | ✅ Fully cleared, anchored on Hedera |
| **CS-2026-007** | `draft` | 🇯🇵 Japan | 10% | Just created |

---

## Recommended Demo Flow (5 minutes)

### For a judge or evaluator:

**1. Public Verification (no login required)**
- Go to `/verify-pack`
- Type `CS-2026-001` → see full verification report, metrics, and evidence list
- Click "Download manifest" → get a portable JSON proof

**2. Dashboard Overview**
- Login as `exportmanager@harvestlink.demo`
- See the overview dashboard at `/overview` — live stats from Supabase

**3. Consignment Workbench**
- Navigate to `/consignments`
- Click on **CS-2026-001** to see the full workbench:
  - Evidence coverage matrix
  - Attestation list
  - Custody timeline
  - Trust proof card (Hedera anchor)
  - Decision Sentinel (import ready: ✅)

**4. Exception Handling**
- Open **CS-2026-003**
- See 2 blocking exceptions (phytosanitary cert missing + temp deviation)
- Decision Sentinel shows: ❌ NOT READY

**5. Readiness Pipeline**
- Navigate to `/readiness`
- See all 7 cases across different states with completeness bars

**6. Analytics**
- Navigate to `/analytics`
- See state distribution chart and evidence type breakdown

---

## What the Blockchain Does

The app uses a **hybrid architecture** — Supabase for operational data, Hedera HCS for immutable anchoring:

1. When a consignment reaches `import_ready`, the compliance lead generates an **evidence pack**
2. The pack hash (SHA-256) is submitted to **Hedera Consensus Service** (topic ID: `0.0.XXXXXXX`)
3. The transaction receipt is stored in `trust_proofs` table with sequence number + consensus timestamp
4. Anyone can verify independently at: `https://hashscan.io/testnet/topic/0.0.XXXXXXX`

The smart contract (`MangoChainRegistry.sol`) on Polygon Amoy provides an additional on-chain verification layer: `verifyHash(bytes32)` returns `true` if the pack hash was anchored.

---

## Architecture at a Glance

```
Supabase (off-chain)          Hedera HCS (on-chain)
─────────────────────         ──────────────────────
consignment_cases      ──→    trust_proofs (pack_hash)
evidence_objects               MangoChainRegistry.sol
consignment_attestations       (verifyHash, commitAnchor)
consignment_handoffs
consignment_exceptions
state_snapshots (computed)
```

**Key design principle:** Nothing sensitive goes on-chain. Only SHA-256 hashes of aggregated evidence packs are anchored. Raw documents, PII, and metadata stay in Supabase with Row Level Security.

---

## SDG Impact

| SDG | Connection |
|-----|-----------|
| **SDG 1 — No Poverty** | Gives smallholder farmers in Peru/Mexico access to upfront financing by providing verifiable proof of pending harvests. The "Financing Readiness" view is designed for lenders. |
| **SDG 2 — Zero Hunger** | Reduces waste and delays in perishable supply chains by cutting decision uncertainty from days to minutes. |
| **SDG 12 — Responsible Consumption** | Gives buyers and importers verifiable transparency about the origin, quality, and handling of produce. |
| **SDG 17 — Partnerships** | Multi-actor protocol (17 actor types) enabling coordination between producers, exporters, inspectors, customs, and financiers — all in one verifiable audit trail. |

---

*HarvestLink Protocol — Built at TKS & Velocity*
