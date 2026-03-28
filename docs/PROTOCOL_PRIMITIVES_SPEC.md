# DOCUMENTO 2 — Protocol Primitives Spec

**Version:** `v1.0.0`  
**Status:** Normative (MVP enforceable)  
**Scope:** Consignment compliance protocol (hybrid off-chain/on-chain)

---

## 1) Objetivo

Este documento define las 9 primitives **como protocolo formal**, no solo como schema.

Incluye:
- Modelo de datos canónico
- Reglas de versionado y mutabilidad
- Ownership y autoridad de escritura
- Relaciones explícitas (grafo del protocolo)
- Constraints y reglas de validación verificables

---

## 2) Convenciones Normativas

Las palabras **MUST**, **MUST NOT**, **SHOULD**, **MAY** se interpretan como RFC 2119.

- **MUST**: obligatorio para conformidad de protocolo
- **MUST NOT**: prohibido
- **SHOULD**: recomendado, con justificación si no se cumple
- **MAY**: opcional

---

## 3) Identidad, Ownership y Mutabilidad

### 3.1 Identificadores
- Toda primitive MUST tener `id` único (UUID/ULID) excepto `EvidencePack` que puede ser derivada por hash+version.
- Toda primitive MUST tener `created_at`.

### 3.2 Ownership canónico
- `PhysicalLot.owner_actor_id` = actor responsable del origen del lote.
- `ConsignmentCase.owner_actor_id` = exporter actor.
- `EvidenceObject.owner_actor_id` = actor que la emite/sube.
- `Attestation.owner_actor_id` = actor firmante.
- `CustodyTransfer.owner_actor_id` = sender actor del handoff.
- `StateSnapshot.owner_actor_id` = actor/sistema que dispara snapshot.
- `Anchor.owner_actor_id` = submitter autorizado en contrato.

### 3.3 Mutabilidad
- `EvidenceObject`, `StateTransition`, `StateSnapshot`, `Anchor` MUST be append-only (NO UPDATE/DELETE semántico).
- `Attestation` MAY ser revocada/superseded, pero su registro original MUST preservarse.
- `CustodyTransfer` MAY enriquecer firmas faltantes (sender/receiver/witness), pero MUST mantener historial auditable.
- `ConsignmentCase` MAY actualizar campos operativos (`current_state`, métricas), pero MUST mantener trazabilidad por eventos/transitions.

### 3.4 Versionado
- Toda entidad anclable MUST incluir `version` o derivarse de una secuencia monotónica.
- `Anchor.version` MUST incrementar por `consignment_id + anchor_type`.
- `EvidencePack.version` MUST incrementar por `consignment_id`.
- Cambios incompatibles de spec MUST incrementar major version (`v2.0.0`, etc.).

---

## 4) Las 9 Protocol Primitives (Canónicas)

## Primitive 1: PhysicalLot

Represents a unit of physical origin.

```ts
PhysicalLot {
  id: string
  origin: geo_location
  crop_type: string
  harvest_date: timestamp
  producer_id: ActorID
  owner_actor_id: ActorID
  created_at: timestamp
}
```

**Rules:**
- `producer_id` MUST reference a registered actor with producer-compatible role.
- `harvest_date` MUST NOT be in the future.
- Un lote MAY pertenecer a múltiples consignaciones vía relación explícita (`consignment_lots`).

---

## Primitive 2: ConsignmentCase

Unidad operativa que agrupa uno o más lotes.

```ts
ConsignmentCase {
  id: string
  lots: PhysicalLot[]
  exporter_id: ActorID
  destination: string
  created_at: timestamp
  current_state: CaseState
  version: number
  owner_actor_id: ActorID
}
```

**Rules:**
- MUST have at least 1 `PhysicalLot` before transitioning to `docs_complete`.
- `exporter_id` MUST be authorized in `actor_roles` for the case.
- `current_state` MUST be consistent with latest `StateTransition.to_state`.

---

## Primitive 3: EvidenceObject

Artefacto verificable.

```ts
EvidenceObject {
  id: string
  type: "certificate" | "document" | "event" | "measurement"
  source: ActorID
  hash: string
  timestamp: timestamp
  storage_uri: string
  owner_actor_id: ActorID
  immutable: true
}
```

**Rules:**
- `hash` MUST be SHA-256 (or stronger, declared in metadata).
- `hash` MUST uniquely identify payload bytes.
- `EvidenceObject` MUST NOT be edited after creation.
- If `storage_uri` changes physically, a new EvidenceObject MUST be created.

---

## Primitive 4: Attestation

Afirmación atribuida.

```ts
Attestation {
  id: string
  claim: string
  actor_id: ActorID
  evidence_refs: EvidenceObject[]
  signature: string
  signature_method: "platform_auth" | "wallet_signature" | "qualified_electronic" | "manual_upload" | "api_token"
  revoked: boolean
  supersedes?: AttestationID
  owner_actor_id: ActorID
  created_at: timestamp
}
```

**Rules:**
- MUST reference at least 1 `EvidenceObject` unless explicitly declared `self-attested`.
- `signature` MUST be verifiable under `signature_method`.
- Revocation MUST preserve original attestation and reason.

---

## Primitive 5: CustodyTransfer

```ts
CustodyTransfer {
  id: string
  from: ActorID
  to: ActorID
  timestamp: timestamp
  evidence: EvidenceObject[]
  signing_level: "unsigned" | "sender_signed" | "receiver_acknowledged" | "dual_signed" | "third_party_witnessed"
  sender_signature?: string
  receiver_signature?: string
  witness_actor_id?: ActorID
  witness_signature?: string
  geolocation?: { lat: number, lng: number, accuracy_m?: number }
  owner_actor_id: ActorID
}
```

**Critical Rule (enforceable):**
- Un custody transfer **MUST NOT** contarse como continuidad real si `signing_level = unsigned`.
- Debe tener al menos uno de: `sender_signed`, `receiver_acknowledged`, `dual_signed`, `third_party_witnessed`.

**Evidence Rule:**
- Cada transfer SHOULD enlazar evidencia de soporte (foto/doc/seal record/timestamp/geolocation si aplica).

---

## Primitive 6: Exception

```ts
Exception {
  id: string
  type: string
  severity: "blocking" | "warning"
  description: string
  resolved: boolean
  resolution_evidence?: EvidenceObject[]
  created_at: timestamp
}
```

**Rules:**
- `blocking` exceptions MUST impact readiness until resolved.
- Resolution SHOULD include evidence link (`resolution_evidence`).

---

## Primitive 7: StateSnapshot

```ts
StateSnapshot {
  id: string
  completeness: number
  continuity: number
  readiness: boolean
  exceptions: Exception[]
  snapshot_hash: string
  trigger: "state_transition" | "evidence_pack_request" | "anchor_commit" | "manual" | "periodic"
  created_at: timestamp
  immutable: true
}
```

**Rules:**
- `completeness` and `continuity` MUST be deterministic from referenced data.
- Snapshot MUST be immutable and reproducible.

---

## Primitive 8: Anchor

```ts
Anchor {
  id: string
  hash: string
  chain: string
  tx_hash: string
  timestamp: timestamp
  anchor_type: "evidence_pack" | "attestation" | "state_snapshot" | "custody_chain" | "full_consignment"
  scope: string
  version: number
  owner_actor_id: ActorID
  immutable: true
}
```

**Rules:**
- On-chain payload MUST contain hashes only (NO PII / NO documents / NO rich metadata).
- `hash` MUST correspond exactly to off-chain artifact hash.

---

## Primitive 9: EvidencePack

```ts
EvidencePack {
  consignment_id: string
  documents: EvidenceObject[]
  attestations: Attestation[]
  snapshot: StateSnapshot
  hash: string
  version: number
  generated_at: timestamp
}
```

**Rules:**
- `hash` MUST be deterministic from canonical serialization of pack contents.
- EvidencePack SHOULD be both human-readable and machine-readable.
- EvidencePack MUST be anchorable and verifiable by third parties.

---

## 5) Grafo del Protocolo (Relaciones Explícitas)

Directed relation set (minimum required):

- `ConsignmentCase` **contains** `PhysicalLot` (many-to-many via `consignment_lots`)
- `ConsignmentCase` **has** `StateTransition` (1-to-many)
- `ConsignmentCase` **has** `CustodyTransfer` (1-to-many)
- `ConsignmentCase` **has** `Exception` (1-to-many)
- `ConsignmentCase` **has** `StateSnapshot` (1-to-many)
- `ConsignmentCase` **has** `Anchor` (1-to-many)
- `Attestation` **references** `EvidenceObject` (many-to-many)
- `CustodyTransfer` **references** `EvidenceObject` (many-to-many)
- `StateSnapshot` **summarizes** `Exception[]`, custody metrics, evidence metrics
- `EvidencePack` **contains** `EvidenceObject[]`, `Attestation[]`, `StateSnapshot`
- `Anchor` **commits** `EvidencePack.hash` OR `StateSnapshot.hash`

Graph invariant:
- Todo `Anchor.hash` MUST resolve to exactamente un artifact off-chain versionado.

---

## 6) Constraints y Reglas de Validación (MVP)

## 6.1 Estado y transición
- Self-transition MUST be rejected.
- Transition actor MUST be participant autorizado.
- Transition to `import_ready` MUST fail if `blocking_exception_count > 0`.

## 6.2 Custodia
- `CustodyTransfer.from != CustodyTransfer.to`.
- `timestamp` MUST be monotónico no-decreciente por cadena de handoffs de una consignación.
- Custody continuity score MUST penalizar `unsigned` y handoffs sin receiver acknowledgment.

## 6.3 Evidencia
- `EvidenceObject.hash` MUST be present and non-empty.
- `EvidenceObject.type` MUST be one of canonical values.
- Evidence refs in `Attestation` and `CustodyTransfer` MUST point to existing evidence records.

## 6.4 Anchoring
- `Anchor.version` MUST increment monotonically.
- Duplicate `(consignment_id, anchor_type, version)` MUST be rejected.
- `verifyHash(hash)` on-chain SHOULD return true before marking as externally verifiable.

## 6.5 Readiness
- `readiness=true` requires:
  - zero blocking exceptions,
  - minimum evidence completeness threshold,
  - custody continuity threshold,
  - required attestations present.

---

## 7) Conformance Profile (MVP)

Una implementación es **Protocol-Conformant (MVP)** si cumple:

1. Implementa las 9 primitives con IDs estables.
2. Enforce de mutabilidad (append-only en artifacts críticos).
3. Custody transfer signed-level enforceable (no continuidad real con `unsigned`).
4. Anchoring hash-only on-chain.
5. EvidencePack hash determinístico + verificación externa.
6. Constraints de transición, evidencia y readiness activas.

---

## 8) Governance y Evolución de Spec

- Cambios no rompientes: `MINOR` (`v1.1.0`)
- Cambios rompientes: `MAJOR` (`v2.0.0`)
- Deprecaciones MUST anunciarse con ventana de transición.
- Cada versión SHOULD incluir mapping de compatibilidad de datos y APIs.

---

## 9) Nota de implementación (este repo)

Este repositorio ya implementa gran parte de este spec en:
- `supabase/migrations/20260327200000_primitives_and_anchoring.sql`
- `supabase/migrations/20260327300000_custody_actors_snapshots.sql`
- `contracts/MangoChainRegistry.sol`
- `src/services/*` y `src/types/consignment.types.ts`

Este documento fija la capa normativa para evitar deriva a “solo schema”.
