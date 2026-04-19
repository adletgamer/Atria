# Why I Abandoned AI and IoT to Build a Compliance Protocol on Hedera — And What I Found at the Bottom of a $2.6B Problem

*A technical deep-dive into ATRIA: a consignment readiness engine for perishable exports, anchored on Hedera Consensus Service.*

---

I spent months training convolutional neural networks to detect citrus canker on mango leaves. The models worked. Accuracy was respectable. The inference pipeline ran on edge devices. I was proud of it.

Then I visited a packing house in Piura, Peru — the region that exports 70% of the country's mangoes — and realized I had been solving the wrong problem.

The farmer I spoke to didn't lose his harvest to pests. He lost it to a 72-hour customs delay caused by a missing phytosanitary certificate that was, in fact, sitting in a government portal nobody checked. By the time the paperwork cleared, 4 tons of Kent mangoes had breached cold-chain tolerance. The shipment was rejected at the port of Rotterdam.

No neural network could have prevented that. No IoT sensor could have accelerated a bureaucratic process that runs on email threads, PDF attachments, and phone calls between twelve different actors who don't share a common system.

That moment changed the trajectory of my TKS Focus Project entirely. I stopped asking "how do we detect problems in agriculture?" and started asking "how do we verify that a shipment is ready before it leaves the dock?" The answer, it turns out, required thinking about trust infrastructure — not sensors.

This is the story of ATRIA.

---

## The $2.6 Billion Uncertainty Tax

Before diving into architecture, let's establish the problem with precision, because the justification for using blockchain here needs to survive scrutiny.

Every year, approximately $2.6 billion in fresh produce is rejected or delayed at international customs. The root cause is not quality — it's verifiability. An importer in Hamburg cannot quickly confirm whether a container of Peruvian mangoes has: (a) a valid phytosanitary certificate from SENASA, (b) continuous cold-chain documentation, (c) a lab report showing pesticide residue below EU MRL thresholds, (d) inspection sign-offs from both the exporter's quality team and the port authority, and (e) an unbroken chain of custody from the farm gate to the shipping container.

These documents exist. They're just fragmented across incompatible systems. The phytosanitary certificate lives in VUCE (Peru's single-window trade platform). The lab report is a PDF emailed from a private laboratory. The cold-chain log is on a proprietary IoT platform. The inspection sign-off is a stamp on a physical document, photographed and uploaded to a shared drive.

There is no canonical, tamper-evident record that aggregates all of this into a single verifiable artifact.

The result is what trade finance professionals call "documentary uncertainty" — and it's the single largest non-tariff barrier to perishable exports from developing countries. For 320,000 smallholder farming families in Peru and Mexico, this uncertainty means they cannot access pre-shipment financing (because lenders can't verify readiness), they absorb the full cost of spoilage from delays, and they have no leverage to dispute rejected shipments even when their produce was compliant.

This is not a technology problem in the conventional sense. It's a trust infrastructure problem.

---

## Why Blockchain? A Skeptic's Justification

I want to address this directly, because "blockchain for agriculture" has earned its reputation for vaporware and because any technical reader should demand a rigorous justification.

Here is the specific claim: **the only component that goes on-chain is a SHA-256 hash.** Nothing else. No PII. No documents. No metadata. No tokens. No NFTs. No DeFi yield farming for mangoes.

The question is not "should we put agricultural data on a blockchain?" — the answer to that is almost always no. The question is: **"Is there a specific artifact in this system that benefits from immutable, publicly verifiable, third-party-auditable timestamping?"**

The answer is yes: the Evidence Pack hash.

An Evidence Pack is a Merkle root computed from the SHA-256 hashes of every compliance document, attestation, and custody record associated with a shipment. When this single hash is submitted to Hedera Consensus Service, anyone — an importer, a customs officer, a trade financier, an auditor — can independently verify it by querying the Hedera Mirror Node. No account required. No API key. No trust relationship with the exporter.

This is the precise and narrow use case where a public consensus layer adds value that no centralized database can replicate: **adversarial verifiability**. The exporter cannot retroactively alter the evidence pack after anchoring. The platform operator cannot selectively revoke or modify records. And the verifier doesn't need to trust anyone — they verify the math.

If Hedera goes down (it won't, but let's be paranoid), the system continues to function. All operational data lives in Supabase with Row Level Security. The blockchain layer is a verification mechanism, not a dependency. This is a deliberate architectural choice: the protocol degrades gracefully.

For readers who work with Hedera: we use HCS (Consensus Service), not HTS or smart contracts on Hedera's native network. HCS gives us ordered, timestamped, immutable message logs at ~$0.0001 per message. The topic ID is public: `0.0.8535355` on testnet. We also maintain a Solidity contract (`MangoChainRegistry.sol`, 0.8.20) on Polygon Amoy for teams that prefer EVM-based verification via `verifyHash(bytes32)`.

The dual-chain approach is intentional: Hedera for production anchoring (cost, finality, throughput), Polygon for EVM interoperability and smart contract extensibility.

---

## The Road to ATRIA: From MangoChain to a Protocol

The project didn't start as a protocol. It started as "MangoChain" — a straightforward supply chain tracker. Register a mango lot, generate a QR code, let consumers scan it. It was the kind of project you build when you've just learned about blockchain and want to apply it to something real.

It was also, in hindsight, solving a problem that doesn't exist. Consumers don't scan QR codes on mangoes. The actual pain point in the supply chain isn't consumer transparency — it's B2B compliance verification between exporters, importers, regulators, and financiers.

The rename to HarvestLink reflected a shift toward the compliance angle. Then Verifield sharpened the focus further: verification as the core value proposition. ATRIA — inspired by Alpha Trianguli Australis, the brightest star in the Southern Triangle constellation — represents the current and definitive form: a protocol that triangulates trust between the three vertices of global trade: the exporter who produces, the regulator who certifies, and the importer who receives.

Each rename wasn't cosmetic. It tracked a genuine architectural pivot.

---

## Protocol Architecture: The 9 Primitives

ATRIA is built on 9 formal protocol primitives. This isn't just a data model — it's a specification with normative rules (RFC 2119 semantics: MUST, MUST NOT, SHOULD, MAY) governing mutability, ownership, and validation.

**Primitive 1 — PhysicalLot.** A unit of physical origin: harvest date, GPS coordinates, crop variety, producer identity. A lot MUST have a registered producer. Harvest date MUST NOT be in the future (obvious, but you'd be surprised what systems allow).

**Primitive 2 — ConsignmentCase.** The central operational unit. Groups one or more lots destined for a single importer. This is where the state machine lives.

**Primitive 3 — EvidenceObject.** Any compliance artifact: certificates, lab reports, inspection photos, cold-chain logs. Each one is SHA-256 hashed client-side before upload. The hash is the canonical identifier. Evidence objects are append-only — MUST NOT be edited after creation.

**Primitive 4 — Attestation.** A claim made by an actor, backed by evidence references. Supports five signature methods: platform authentication, wallet signature, qualified electronic signature, manual upload, and API token. Attestations can be revoked but the original record MUST be preserved.

**Primitive 5 — CustodyTransfer.** A chain-of-custody handoff between actors. This is where ATRIA gets opinionated: a transfer with `signing_level = unsigned` MUST NOT count toward custody continuity. You need at least sender-signed or receiver-acknowledged for the handoff to be real. Optional geolocation capture.

**Primitive 6 — Exception.** Blocking or warning-level issues. A blocking exception halts state progression — period. Resolution requires evidence.

**Primitive 7 — StateSnapshot.** A computed, immutable snapshot of a consignment's readiness at a point in time. Includes completeness score, continuity score, exception list, and readiness verdict. The snapshot hash can itself be anchored.

**Primitive 8 — Anchor.** The on-chain record. Contains only: hash, chain identifier, transaction hash, timestamp, anchor type, scope, and version. Nothing else. No PII. No documents. Immutable.

**Primitive 9 — EvidencePack.** The crown jewel. A Merkle root computed from the hashes of all evidence objects, attestations, and the current state snapshot for a consignment. This is what gets anchored on Hedera. This is what anyone can verify.

> [Placeholder: Insert diagram showing the 9 primitives and their relationships as a directed graph. ConsignmentCase at center, with edges to all other primitives. EvidencePack at the top, pointing to Anchor.]

---

## The State Machine: Why Formal States Matter

ATRIA enforces a strict 7-state progression for every consignment:

```
draft → evidence_collecting → docs_complete → treatment_attested 
    → custody_continuous → import_ready → released
```

Each transition requires an authorized actor and evidence references. Self-transitions are rejected. Backward transitions are not permitted (you don't "un-complete" documentation). And critically: **a consignment cannot reach `import_ready` if any blocking exception exists.**

This is enforced in code, not by convention.

The Decision Sentinel — the component that renders the go/no-go verdict — computes readiness in real time from the current state, exception count, evidence completeness, and custody continuity. It's deterministic: given the same inputs, any implementation of the protocol MUST reach the same verdict.

Why is this level of formalism necessary? Because the entire value proposition of ATRIA depends on the reliability of the readiness signal. If an importer queries a consignment's Evidence Pack hash and it's been anchored on Hedera, that hash represents a commitment: all documents were present, all attestations were valid, all custody transfers were signed, and zero blocking exceptions existed at the time of anchoring. If any of those conditions were soft-enforced, the hash would be meaningless.

> [Placeholder: Insert state machine diagram showing the 7 states, transitions, and blocking conditions at each gate.]

---

## Hybrid Architecture: The Off-Chain/On-Chain Split

One of the most consequential design decisions in ATRIA is the strict separation between operational data (off-chain) and verification artifacts (on-chain).

**Off-chain (Supabase):** All 9 primitives live in PostgreSQL with Row Level Security policies scoping every query to organization participants. The RLS model supports a 17-actor access framework: exporter, importer, inspector, customs official, lab technician, transporter, certifier, financing officer, and more. Direct table access is blocked for anonymous users.

**On-chain (Hedera HCS + Polygon Amoy):** Only SHA-256 hashes of Evidence Packs (and optionally, state snapshots) are anchored. The Hedera topic receives HCS messages containing the Merkle root. The Polygon contract exposes `verifyHash(bytes32) → bool` for EVM-native verification.

**The bridge:** When a consignment reaches `import_ready`, the system generates an Evidence Pack (Primitive 9), computes the Merkle root, submits it to HCS, and stores the resulting `Anchor` (Primitive 8) back in Supabase with the transaction hash and timestamp.

**Public verification at `/verify-pack`:** No login required. Enter a consignment ID (e.g., `CS-2026-001`). The system retrieves the anchor, queries the Hedera Mirror Node, and displays whether the hash matches. The entire verification path is trustless — the verifier interacts directly with Hedera's public API.

> [Placeholder: Insert architecture diagram showing Browser ↔ Supabase ↔ Hedera HCS, with the Polygon contract as an optional EVM verification path.]

The key design principle deserves emphasis: **nothing sensitive goes on-chain.** This is not a philosophical preference — it's a regulatory requirement. Agricultural compliance data often includes phytosanitary certificates with exporter PII, lab results with proprietary formulations, and custody records with GPS coordinates of private facilities. Putting any of this on a public ledger would violate GDPR, Peru's Ley de Protección de Datos Personales, and common sense.

---

## The Technical Stack, Honestly

I want to be transparent about what's built, what's mocked, and what's on the roadmap. Technical articles that only show the polished surface do a disservice to the reader.

**What's real and working today:**

The frontend is React 18 + TypeScript + Vite, with Tailwind CSS and Shadcn/ui for the component system. Framer Motion handles animations. The consignment workbench — evidence matrix, attestation panel, custody timeline, Decision Sentinel — is fully functional with live Supabase data. Seven demo consignment cases cover all states, with real evidence objects, attestations, and exceptions.

Hedera HCS anchoring is live on testnet. The Evidence Pack generation (SHA-256 hashing, Merkle root computation) runs client-side in TypeScript. The `MangoChainRegistry.sol` contract is deployed on Polygon Amoy. Forty-four integration test assertions pass in Vitest under TypeScript strict mode.

Authentication uses Supabase Auth with OAuth (Google/Apple) support. Wallet connection uses Wagmi v2 + Viem + RainbowKit.

**What's honest-to-god still in progress:**

There is no standalone backend API. The architecture calls for a Node.js + Express layer to handle server-side anchoring (so the Hedera operator key doesn't live client-side in production). This is the next critical milestone. The current workaround is a Supabase Edge Function, which works but isn't the long-term architecture.

IoT sensor integration doesn't exist yet. The cold-chain data in the demo is manually entered, not streamed from hardware. This is a Phase 3+ concern.

The Trust Score — a computed reputation metric for actors based on their historical compliance behavior — is designed but not implemented. It needs statistical significance (500+ completed consignments) to be meaningful.

SENASA and SUNAT API integration is in the research phase. Peru's regulatory APIs are not publicly documented, and integration requires institutional partnerships that are in early conversations.

---

## Why This Matters Beyond Mangoes

The protocol is domain-specific today (Peruvian mango exports), but the architecture is deliberately generic. The 9 primitives don't reference mangoes anywhere in their specification. `PhysicalLot` could be avocados, flowers, pharmaceuticals, or any perishable good. `ConsignmentCase` groups any set of lots for any destination. The state machine, evidence framework, and anchoring layer are crop-agnostic.

This matters because the compliance verification problem is not unique to Peru or to mangoes. Every perishable export corridor in the world — Chilean cherries to China, Kenyan flowers to the Netherlands, Mexican avocados to the United States — faces the same documentary uncertainty.

The vision is that ATRIA becomes what TCP/IP is to the internet: a protocol layer that anyone can build on. An exporter in Kenya uses a different frontend. A customs authority in the EU uses a different verification interface. But they all produce and consume the same primitives, and the Evidence Pack hash is universally verifiable on the same public ledger.

Is that ambitious? Absolutely. Is it feasible? The architecture supports it. Whether it happens depends on adoption, partnerships, and the unglamorous work of integrating with real regulatory systems — not on the elegance of the protocol design.

---

## SDG Impact: Measured, Not Declared

ATRIA aligns with four UN Sustainable Development Goals, but I want to frame this in terms of measurable impact, not marketing.

**SDG 2 — Zero Hunger.** Every hour of compliance delay is food that spoils instead of reaching consumers. If ATRIA reduces decision time from 72 hours to 3 minutes (which is what the demo shows for the verification step), that's a measurable reduction in post-harvest loss for perishable supply chains.

**SDG 1 — No Poverty.** Pre-shipment financing is currently inaccessible to most smallholder exporters because lenders can't verify readiness without waiting weeks for documents. An anchored Evidence Pack hash could serve as a triggering event for same-day financing release. This is speculative but architecturally supported — the Financing Panel in the demo already computes evidence sufficiency scores and custody continuity scores.

**SDG 12 — Responsible Consumption.** A tamper-evident, hash-anchored audit trail of every document, inspection, and custody transfer enables informed sourcing. The key word is "tamper-evident" — this is what distinguishes ATRIA from a shared spreadsheet.

**SDG 17 — Partnerships.** A 17-actor protocol with a shared, authoritative record enables coordination that was previously impossible without a trusted intermediary. The protocol design explicitly avoids requiring trust in any single party, including the platform operator.

---

## Lessons from Building This Solo in 3 Weeks

ATRIA was built as a solo sprint during the TKS/Velocity program track. Some reflections for other builders:

**Start with the wrong problem.** My AI pest detection work wasn't wasted — it taught me the agricultural domain deeply enough to recognize the real pain point when I encountered it. If I'd started with "I want to build something on blockchain," I would have built a generic supply chain tracker. Starting with "I want to help farmers" led me to the actual problem.

**Name your primitives before you write code.** The 9 primitives specification was written before most of the implementation. It forced clarity on what each entity meant, who owned it, and what could change after creation. The append-only constraint on evidence objects, for example, prevented an entire class of bugs where evidence was silently modified after attestation.

**The blockchain layer should be the last thing you build.** ATRIA was functional and useful as a Supabase-only application before a single hash was anchored on Hedera. If your application doesn't work without the blockchain, your architecture has a problem. If it works without the blockchain but gains adversarial verifiability with it, you've found the right use case.

**Be honest about what's mocked.** Demo data is demo data. The real test of this protocol is whether a SENASA inspector in Piura will actually use it. That's a product and partnership challenge, not an engineering challenge.

---

## What's Next

The immediate roadmap has three milestones:

The first is deploying ATRIA to production with the Hedera operator key secured in a server-side Edge Function, eliminating the last client-side key exposure. The second is building the standalone REST API for third-party verification — so a bank's system can programmatically query a consignment's readiness status and Evidence Pack hash without using the ATRIA frontend. The third is the first real Evidence Pack anchored on Hedera mainnet, with a real shipment, real documents, and a real exporter in Piura.

After that: SENASA API integration research, a lender verification pilot, and the beginning of conversations about protocol standardization.

---

## Final Thought

The most technically interesting thing about ATRIA isn't the blockchain anchoring or the Merkle tree computation. It's the state machine. Specifically, the fact that a consignment can be blocked from reaching `import_ready` by a single unresolved exception, regardless of how complete everything else looks.

This is the engineering equivalent of "trust but verify" — except we've removed the "trust" part entirely. The readiness signal is computed, not declared. The evidence is hashed, not asserted. The hash is anchored, not promised.

In a world where $2.6 billion in food is lost to documentary uncertainty every year, that distinction matters.

---

*Alex is a TKS (The Knowledge Society) & Velocity member building at the intersection of blockchain infrastructure and agricultural trade compliance. ATRIA is their Focus Project for the Google Factory X Moonshot 2026 track.*

*If you're working on trade compliance, agricultural supply chains, or Hedera-based protocols — I'd like to hear from you. Let's build the verification layer that global trade is missing.*

---

**Technical resources:**
- GitHub: [github.com/adletgamer/mango-rastreo-chain](https://github.com/adletgamer/mango-rastreo-chain)
- Live public verifier: `/verify-pack` — enter `CS-2026-001` to see a live Hedera-verified Evidence Pack
- Protocol Primitives Spec: `docs/PROTOCOL_PRIMITIVES_SPEC.md`
- Hedera testnet topic: `0.0.8535355`
- Smart contract: `MangoChainRegistry.sol` — Polygon Amoy

---

*Tags: #Blockchain #Hedera #SupplyChain #Agriculture #Web3 #SmartContracts #Solidity #TKS #Protocol #TradeFinance*
