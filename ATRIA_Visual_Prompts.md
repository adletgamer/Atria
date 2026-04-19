# ATRIA — Prompts para Recursos Visuales del Artículo

Instrucciones precisas para generar cada recurso visual que necesitas para el artículo técnico.
Usa estos prompts en Midjourney, DALL-E, Figma, o tu herramienta preferida.

---

## 1. HERO IMAGE — Cabecera del Artículo

**Propósito:** Imagen principal que abre el artículo en Medium. Debe capturar la esencia de ATRIA: blockchain + agricultura + verificación.

**Prompt (AI Image Generation):**
```
A cinematic wide-angle photograph of a shipping container port at golden hour, with digital holographic overlays showing SHA-256 hash strings, Merkle tree diagrams, and green verification checkmarks floating above the containers. In the foreground, crates of fresh mangoes with QR codes visible. The aesthetic is dark, technical, and sophisticated — not stock photography. Color palette: deep navy background, electric teal accents (#00D4AA), warm amber highlights (#F59E0B). Aspect ratio 16:9. Photorealistic with sci-fi data visualization overlay.
```

**Alternativa minimalista:**
```
Abstract geometric composition: a triangle (representing ATRIA / Alpha Trianguli Australis) formed by three glowing nodes connected by thin luminous lines. Each node represents: a farm (green glow), a customs checkpoint (blue glow), and an importer (amber glow). Data streams flow along the edges. Background: deep black with subtle star field. Style: clean, technical, protocol-grade. Colors: #0A0F1C background, #00D4AA primary, #3B82F6 secondary, #F59E0B tertiary. 16:9 aspect ratio.
```

---

## 2. DIAGRAMA DE ARQUITECTURA — Hybrid Off-Chain / On-Chain

**Propósito:** Mostrar la separación clara entre datos operativos (Supabase) y verificación (Hedera/Polygon).

**Instrucciones para Figma/Excalidraw/Draw.io:**

```
Layout: Three-column horizontal diagram

LEFT COLUMN — "Browser (React + Viem)"
- Box: "Consignment Workbench"
- Box: "Evidence Upload"
- Box: "Attestation Request"  
- Box: "Exception Resolution"
- Box: "Pack Generation"
- Box: "Public Verification"
- Style: Rounded rectangles, border #1E293B, fill #0F172A, text #E2E8F0

CENTER COLUMN — "Supabase (Off-chain)"
- Box: "consignment_cases"
- Box: "evidence_objects"
- Box: "consignment_attestations"
- Box: "consignment_exceptions"
- Box: "trust_proofs"
- Callout: "PostgreSQL + RLS · 17-actor access model"
- Style: Same boxes, but with blue left-border accent (#3B82F6)

RIGHT COLUMN — "Hedera HCS (On-chain)"  
- Box: "Topic 0.0.8535355"
- Box: "SHA-256 Merkle Root"
- Callout: "Only hashes. No PII. No documents."
- Style: Same boxes, but with teal left-border accent (#00D4AA)

BOTTOM — "Polygon Amoy (Optional EVM)"
- Box: "MangoChainRegistry.sol"
- Box: "verifyHash(bytes32) → bool"
- Style: Violet accent (#8B5CF6)

ARROWS:
- Browser → Supabase: solid lines, bidirectional
- Supabase → Hedera: solid line, one direction (hash only)
- Public Verification ← Hedera Mirror Node: dashed line (trustless query)

OVERALL STYLE:
- Dark background (#0A0F1C)
- White/light gray text (#E2E8F0)
- Subtle grid pattern in background
- Color coding: Blue = off-chain, Teal = on-chain, Violet = EVM
- Font: Inter or Space Grotesk
- No gradients, no shadows — clean protocol aesthetic
```

---

## 3. STATE MACHINE — Flujo de Estados de Consignación

**Propósito:** Visualizar la progresión obligatoria de 7 estados con condiciones de bloqueo.

**Instrucciones:**

```
Layout: Horizontal flow diagram, left to right

STATES (rounded pill shapes):
1. "draft" — Color: Gray (#6B7280), subtle
2. "evidence_collecting" — Color: Blue (#3B82F6)  
3. "docs_complete" — Color: Amber (#F59E0B)
4. "treatment_attested" — Color: Orange (#F97316)
5. "custody_continuous" — Color: Violet (#8B5CF6)
6. "import_ready" — Color: Teal (#00D4AA) — HIGHLIGHTED, larger
7. "released" — Color: Emerald (#10B981)

ARROWS between each state: 
- Thin lines with arrow heads
- Label on each arrow: "requires: [condition]"
  - draft → evidence_collecting: "actor + case created"
  - evidence_collecting → docs_complete: "min evidence threshold"
  - docs_complete → treatment_attested: "attestation from certifier"
  - treatment_attested → custody_continuous: "signed custody transfers"
  - custody_continuous → import_ready: "zero blocking exceptions"
  - import_ready → released: "Evidence Pack anchored on Hedera"

BLOCKING INDICATOR:
- A red dashed line from "Exception (blocking)" pointing to the flow
  between custody_continuous and import_ready
- Label: "HALTS progression until resolved"
- Small red icon (stop sign or shield with X)

ANNOTATION at import_ready:
- Callout box: "Decision Sentinel: deterministic go/no-go"
- Small Hedera logo or hash icon

STYLE:
- Dark background (#0A0F1C)
- States are pill-shaped with colored fill at ~15% opacity + colored border
- Arrows are thin (#475569)
- Monospace font for state names
- Sans-serif for labels
```

---

## 4. LAS 9 PRIMITIVAS — Grafo del Protocolo

**Propósito:** Mostrar las 9 primitivas y sus relaciones como un grafo dirigido.

**Instrucciones:**

```
Layout: Centered directed graph

CENTER NODE (largest):
- "ConsignmentCase" — Teal border (#00D4AA), prominent

SURROUNDING NODES (medium):
- "PhysicalLot" — Green (#10B981) — connected TO ConsignmentCase ("contains")
- "EvidenceObject" — Blue (#3B82F6) — connected TO ConsignmentCase ("belongs to")
- "Attestation" — Amber (#F59E0B) — connected TO EvidenceObject ("references")
- "CustodyTransfer" — Violet (#8B5CF6) — connected TO ConsignmentCase ("tracks")
- "Exception" — Red (#EF4444) — connected TO ConsignmentCase ("blocks")
- "StateSnapshot" — Slate (#64748B) — connected TO ConsignmentCase ("captures")
- "StateTransition" — Indigo (#6366F1) — connected TO ConsignmentCase ("transitions")

TOP NODE (highlighted, with glow effect):
- "EvidencePack" — Teal (#00D4AA) with glow
  - Connected FROM EvidenceObject ("includes")
  - Connected FROM Attestation ("includes")
  - Connected FROM StateSnapshot ("includes")

SEPARATE NODE (connected from EvidencePack):
- "Anchor" — Gold (#EAB308) with chain icon
  - Arrow from EvidencePack to Anchor labeled "hash anchored"
  - Small label: "Hedera HCS / Polygon"

STYLE:
- Dark background
- Nodes are circles or rounded squares
- Edges are curved lines with small arrow heads
- Edge labels in small italic text
- Each node has a small icon inside (document, shield, chain, etc.)
- Legend at bottom showing: "Immutable" (lock icon), "Append-only" (+ icon)
```

---

## 5. EVIDENCE PACK — Merkle Tree Visualization

**Propósito:** Mostrar cómo se computa el hash del Evidence Pack desde documentos individuales.

**Instrucciones:**

```
Layout: Binary tree, bottom to top

BOTTOM LAYER (leaves) — Individual document hashes:
- "Phyto Certificate" → SHA-256: "a3f8..."
- "Lab Report" → SHA-256: "7c2d..."  
- "Cold Chain Log" → SHA-256: "b91e..."
- "Inspection Sign-off" → SHA-256: "d4a7..."
- "Custody Transfer #1" → SHA-256: "f2c8..."
- "Custody Transfer #2" → SHA-256: "1e9b..."
- "Treatment Attestation" → SHA-256: "8d3f..."
- "Export Declaration" → SHA-256: "c5a1..."

MIDDLE LAYERS — Intermediate hashes:
- Pairs are hashed together
- Show: H("a3f8..." + "7c2d...") = "e7b4..."
- Continue pairing up

TOP (root) — Evidence Pack Hash:
- MERKLE ROOT: "0x9f2a4b..." 
- Large, glowing teal
- Arrow pointing to: "→ Hedera HCS Topic 0.0.8535355"

STYLE:
- Dark background
- Leaf nodes: small document icons with blue tint
- Intermediate nodes: hexagonal or circular, gray
- Root node: large, teal glow (#00D4AA)
- Connecting lines: thin, light gray
- Hash values in monospace font, truncated
- Each leaf has a tiny label identifying the document type
```

---

## 6. BEFORE vs AFTER — Flujo de Compliance Actual vs ATRIA

**Propósito:** Impacto visual del problema vs la solución. Ideal para el artículo.

**Instrucciones:**

```
Layout: Side-by-side comparison, split screen

LEFT SIDE — "Before: 72 hours"
- Title: "Current compliance verification"
- Visual: Chaotic, scattered
  - Email icon with PDF attachments
  - Phone icon (calls between 12 actors)
  - Paper documents with stamps
  - Multiple portals/screens (VUCE, lab system, IoT platform)
  - Clock showing 72h
  - Red X marks on some documents
  - Arrows going in all directions (no clear flow)
- Color palette: Desaturated, warm grays, red accents
- Mood: Frustrating, fragmented

RIGHT SIDE — "After: 3 minutes"  
- Title: "ATRIA verification"
- Visual: Clean, unified
  - Single Evidence Pack icon (glowing)
  - Hash string flowing to Hedera logo
  - Green checkmark
  - Single query → instant result
  - Clock showing 3 min
  - Clean flow: Pack → Hash → Verify → ✓
- Color palette: Dark background, teal/green accents
- Mood: Elegant, decisive, trustworthy

DIVIDER: Vertical line in the middle with "→" arrow

STYLE:
- Illustrative, not photographic
- Clean line art or isometric style
- Strong contrast between chaos (left) and order (right)
```

---

## 7. SDG IMPACT — Infographic

**Propósito:** Visualizar el impacto en los 4 SDGs alineados.

**Instrucciones:**

```
Layout: 2x2 grid of impact cards

CARD 1 — SDG 2 (Zero Hunger)
- Icon: Plate/food icon
- Metric: "72h → 3 min"
- Label: "Decision time reduction"
- Color accent: Amber (#F59E0B)

CARD 2 — SDG 1 (No Poverty)  
- Icon: Wallet/finance icon
- Metric: "Same-day financing"
- Label: "Evidence Pack triggers release"
- Color accent: Red (#EF4444)

CARD 3 — SDG 12 (Responsible Consumption)
- Icon: Shield/audit icon
- Metric: "Tamper-evident trail"
- Label: "Every document hash-anchored"
- Color accent: Green (#10B981)

CARD 4 — SDG 17 (Partnerships)
- Icon: Network/graph icon
- Metric: "17-actor protocol"
- Label: "Shared authoritative record"
- Color accent: Blue (#3B82F6)

STYLE:
- Dark cards with subtle gradient backgrounds
- Large bold metric numbers
- Small descriptive labels
- Official SDG color strip at top of each card
- Clean, data-driven aesthetic
```

---

## 8. TECH STACK — Visual Overview

**Propósito:** Referencia rápida del stack técnico para lectores técnicos.

**Instrucciones:**

```
Layout: Layered horizontal diagram (like a protocol stack)

TOP LAYER — "Frontend"
- React 18 | TypeScript | Vite | Tailwind | Shadcn/ui | Framer Motion
- Color: Blue band

MIDDLE LAYER — "Data & Auth"
- Supabase (PostgreSQL + RLS) | Edge Functions | OAuth
- Color: Green band

BOTTOM LAYER — "Verification"  
- Hedera HCS (anchoring) | Polygon Amoy (MangoChainRegistry.sol) | Wagmi v2 + Viem
- Color: Teal band

SIDE ANNOTATION:
- "Testing: Vitest · 44 assertions · TypeScript strict"
- "Wallet: RainbowKit · MetaMask · WalletConnect"

STYLE:
- Horizontal stacked layers
- Each layer has logos/icons for the technologies
- Dark background
- Subtle depth effect between layers
- Clean, technical look
```

---

## 9. PERSONAL JOURNEY — Timeline Visual

**Propósito:** Ilustrar la evolución del proyecto para la sección narrativa del artículo.

**Instrucciones:**

```
Layout: Horizontal timeline, left to right

POINT 1 — "AI Exploration"
- Icon: Brain/neural network
- Label: "Computer vision for pest detection on mango leaves"
- Subtitle: "CNNs, edge inference, crop disease classification"
- Color: Purple (#8B5CF6)

POINT 2 — "IoT Research"  
- Icon: Sensor/chip
- Label: "Cold-chain monitoring sensors"
- Subtitle: "Temperature, humidity, transport conditions"
- Color: Blue (#3B82F6)

PIVOT POINT — "The Piura Visit" ⚡
- Icon: Lightning bolt or light bulb
- Label: "Farmer loses harvest to 72h paperwork delay"
- Subtitle: "The problem isn't detection — it's verification"
- Color: Amber (#F59E0B) — HIGHLIGHTED
- Visual emphasis: Larger node, glow effect

POINT 3 — "MangoChain"
- Icon: Chain link
- Label: "Basic supply chain tracker + QR codes"
- Subtitle: "Consumer-facing, wrong audience"
- Color: Orange (#F97316)

POINT 4 — "HarvestLink → Verifield"
- Icon: Shield
- Label: "Pivot to B2B compliance verification"
- Color: Teal (#14B8A6)

POINT 5 — "ATRIA" ★
- Icon: Triangle (constellation)
- Label: "Protocol with 9 primitives, formal state machine, Hedera anchoring"
- Subtitle: "Alpha Trianguli Australis — triangulating trust"
- Color: Teal (#00D4AA) — HIGHLIGHTED, with star/glow
- Visual emphasis: Final destination, largest node

STYLE:
- Dark background
- Timeline is a thin horizontal line connecting all points
- Each point is a circle on the line with a vertical stem to the label
- Pivot point has a visual "break" in the timeline (zigzag or burst)
- Progressive color shift from purple → blue → amber → orange → teal
```

---

## 10. COVER IMAGE VARIANTS — Para Redes Sociales

**LinkedIn/Twitter banner (1200x628):**
```
Dark background (#0A0F1C). Center: the word "ATRIA" in large Space Grotesk 
font, white. Below: "Consignment Readiness Protocol" in smaller text, 
#94A3B8. Subtle constellation pattern in background (Triangulum Australe). 
A thin teal line (#00D4AA) forms a triangle connecting three small icons: 
farm, customs, importer. Bottom-right corner: "Built at TKS · Hedera · Polygon" 
in very small text. Clean, minimal, authoritative.
```

**Square format (1080x1080) for Instagram/Medium preview:**
```
Same concept but vertical layout. "ATRIA" centered top-third. 
Triangle constellation in center. Tagline at bottom. 
Add subtle grid/mesh gradient overlay for depth.
```

---

## Notas Generales de Estilo

**Paleta de colores consistente para TODOS los visuales:**
- Background: #0A0F1C (deep navy)
- Primary text: #E2E8F0 (light gray)
- Secondary text: #94A3B8 (muted gray)
- Accent 1 (primary): #00D4AA (electric teal)
- Accent 2: #3B82F6 (blue)
- Accent 3: #F59E0B (amber)
- Accent 4: #8B5CF6 (violet)
- Danger: #EF4444 (red)
- Success: #10B981 (emerald)

**Fuentes:**
- Headlines: Space Grotesk (Bold/Semibold)
- Body: Inter or Sora (Regular/Medium)
- Code/hashes: JetBrains Mono or Fira Code

**Principios:**
- Dark-first: todos los visuales sobre fondo oscuro
- Protocol-grade aesthetic: limpio, técnico, no "startup colorido"
- Minimal pero con detalle: los detalles sutiles (grids, glows) dan sofisticación
- Consistencia: misma paleta, mismas fuentes, mismo estilo en todos los visuales
