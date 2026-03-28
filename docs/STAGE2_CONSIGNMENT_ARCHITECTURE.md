# Stage 2 — Consignment-Centric Architecture

**Fecha:** 27 de marzo, 2026  
**Status:** ACTIVO  
**Decisión:** Eliminar consumer-first. El objeto raíz es Consignment Case.

---

## 1. Tesis

El dolor económico no vive en el lote. Vive en la consignación.

La pregunta que el export manager necesita responder:

> "¿Esta consignación está lista para exportar, con evidencia atribuible,  
> sin reconstrucción manual, y con excepciones claramente delimitadas?"

Si el sistema no responde eso en segundos, no sirve.

---

## 2. Usuarios

### Primario: Export Manager / Compliance Lead (Empacadora-Exportadora)

**Job-to-be-done:**  
Demostrar rápido, con evidencia atribuible, que una consignación está lista  
para exportar/importarse o que una excepción está claramente delimitada.

**Acciones:**
- Crear consignment case
- Agregar lotes a la consignación
- Subir / vincular documentos
- Registrar attestations
- Ver readiness state
- Gestionar excepciones
- Aprobar handoffs

### Secundario: Import Compliance / Buyer Ops (Importador)

**Job-to-be-done:**  
Recibir, verificar y presionar estándares.

**Acciones:**
- Ver consignment case recibido
- Verificar documentos
- Registrar attestations de recepción
- Levantar excepciones
- Confirmar readiness de importación

### Terciario: Auditor / Aseguradora / Financing / Autoridad

**Job-to-be-done:**  
Validar compliance sin reconstruir el dossier manualmente.

**Acciones:**
- Ver consignment case (read-only)
- Verificar attestations
- Revisar excepciones
- Validar cadena de custodia

### Eliminado: Consumidor Final

- Irrelevante en esta fase
- QR público puede existir después como derivado de marketing
- NO es centro de diseño

---

## 3. Modelo de Dominio

```
                    ┌─────────────────────┐
                    │  CONSIGNMENT CASE   │  ← objeto raíz de decisión
                    │  (CS-2026-001)      │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
    ┌─────┴──────┐    ┌───────┴────────┐    ┌──────┴───────┐
    │   LOTS     │    │  DOCUMENTS     │    │ ATTESTATIONS │
    │ (children) │    │ (evidence)     │    │ (assertions) │
    └─────┬──────┘    └────────────────┘    └──────────────┘
          │
    ┌─────┴──────┐    ┌────────────────┐    ┌──────────────┐
    │ lot_attrs  │    │   HANDOFFS     │    │  EXCEPTIONS  │
    │ lot_events │    │  (custody)     │    │  (problems)  │
    └────────────┘    └────────────────┘    └──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │  READINESS STATE    │  ← computado
                    │  (export/import)    │
                    └─────────────────────┘
```

---

## 4. Entidades

### 4.1 consignment_cases (objeto raíz)

| Campo | Tipo | Nota |
|-------|------|------|
| id | UUID PK | Identidad |
| case_number | VARCHAR UNIQUE | Legible: CS-2026-001 |
| exporter_id | UUID FK profiles | Owner principal |
| importer_id | UUID FK profiles | Nullable |
| destination_country | VARCHAR | País destino |
| destination_port | VARCHAR | Puerto destino |
| incoterm | VARCHAR | FOB, CIF, CFR, etc. |
| status | VARCHAR | draft → cleared/rejected |
| readiness_state | VARCHAR | Computado |
| total_pallets | INTEGER | Conteo de pallets |
| total_kg | NUMERIC | Peso total |
| estimated_departure | DATE | Fecha estimada |
| metadata | JSONB | Solo datos técnicos |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Status enum:**
```
draft → pending_docs → pending_inspection → ready_to_ship
→ in_transit → arrived → customs_hold → cleared
                                      → exception
                                      → rejected
```

**Readiness enum:**
```
not_ready → docs_pending → docs_complete → inspection_pending
→ inspection_passed → export_ready → import_ready → fully_cleared
```

### 4.2 consignment_lots (junction lot → consignment)

| Campo | Tipo | Nota |
|-------|------|------|
| id | UUID PK | |
| consignment_id | UUID FK | Consignación padre |
| lot_id | UUID FK lots | Lote hijo |
| sequence_number | INTEGER | Orden en la consignación |
| notes | TEXT | Notas específicas |
| created_at | TIMESTAMPTZ | |

### 4.3 consignment_documents (evidencia verificable)

| Campo | Tipo | Nota |
|-------|------|------|
| id | UUID PK | |
| consignment_id | UUID FK | |
| document_type | VARCHAR | Tipo de documento |
| title | VARCHAR | Título legible |
| file_url | TEXT | URL en Storage |
| file_hash | VARCHAR | Hash de integridad |
| issued_by | VARCHAR | Emisor |
| issued_at | TIMESTAMPTZ | Fecha de emisión |
| expires_at | TIMESTAMPTZ | Fecha de expiración |
| verified | BOOLEAN | Verificado? |
| verified_by | UUID FK profiles | Quién verificó |
| verified_at | TIMESTAMPTZ | Cuándo se verificó |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | |

**Document types:**
```
phytosanitary_cert, certificate_of_origin, bill_of_lading,
packing_list, commercial_invoice, quality_cert, fumigation_cert,
temperature_log, customs_declaration, insurance_cert, other
```

### 4.4 consignment_attestations (assertions humanas)

| Campo | Tipo | Nota |
|-------|------|------|
| id | UUID PK | |
| consignment_id | UUID FK | |
| attestation_type | VARCHAR | Tipo de assertion |
| attested_by | UUID FK profiles | Quién afirma |
| role_at_time | VARCHAR | Rol al momento |
| statement | TEXT | Qué se afirma |
| evidence_refs | UUID[] | Refs a documentos |
| attested_at | TIMESTAMPTZ | |
| revoked | BOOLEAN | Revocada? |
| revoked_at | TIMESTAMPTZ | |
| revoked_reason | TEXT | |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | |

**Attestation types:**
```
quality_confirmed, docs_complete, inspection_passed,
phyto_cleared, export_cleared, import_cleared,
customs_released, payment_confirmed
```

### 4.5 consignment_handoffs (transferencias de custodia)

| Campo | Tipo | Nota |
|-------|------|------|
| id | UUID PK | |
| consignment_id | UUID FK | |
| from_party_id | UUID FK profiles | Entrega |
| to_party_id | UUID FK profiles | Recibe |
| handoff_type | VARCHAR | Tipo de transferencia |
| location | VARCHAR | Ubicación |
| occurred_at | TIMESTAMPTZ | |
| condition_notes | TEXT | Estado del producto |
| temperature_c | NUMERIC | Temperatura al momento |
| evidence_refs | UUID[] | Refs a documentos/fotos |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | |

**Handoff types:**
```
producer_to_packer, packer_to_cold_storage,
cold_storage_to_transport, transport_to_port,
port_to_vessel, vessel_to_destination_port,
destination_port_to_importer, importer_to_warehouse
```

### 4.6 consignment_exceptions (problemas y holds)

| Campo | Tipo | Nota |
|-------|------|------|
| id | UUID PK | |
| consignment_id | UUID FK | |
| exception_type | VARCHAR | Tipo de excepción |
| severity | VARCHAR | info/warning/critical/blocking |
| title | VARCHAR | Título corto |
| description | TEXT | Detalle |
| raised_by | UUID FK profiles | Quién reporta |
| raised_at | TIMESTAMPTZ | |
| resolved | BOOLEAN | Resuelto? |
| resolved_at | TIMESTAMPTZ | |
| resolved_by | UUID FK profiles | Quién resolvió |
| resolution | TEXT | Cómo se resolvió |
| blocks_readiness | BOOLEAN | Bloquea readiness? |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | |

**Exception types:**
```
doc_missing, doc_expired, inspection_fail, quality_deviation,
temperature_breach, customs_hold, damage_report, delay,
regulatory_block, payment_issue
```

### 4.7 consignment_events (timeline append-only)

| Campo | Tipo | Nota |
|-------|------|------|
| id | UUID PK | |
| consignment_id | UUID FK | |
| event_type | VARCHAR | Tipo de evento |
| event_category | VARCHAR | Categoría |
| actor_id | UUID FK profiles | Quién actúa |
| description | TEXT | |
| location | VARCHAR | |
| metadata | JSONB | |
| occurred_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

**Event categories:**
```
lifecycle, document, attestation, handoff, exception, readiness
```

---

## 5. Readiness Model

La readiness de una consignación es computada, no manual.

### Reglas

```
export_ready = ALL of:
  - ≥ 1 lote asignado
  - phytosanitary_cert presente y verificado
  - certificate_of_origin presente y verificado
  - packing_list presente
  - commercial_invoice presente
  - 0 excepciones blocking sin resolver
  - attestation quality_confirmed presente
  - attestation docs_complete presente

import_ready = export_ready AND:
  - bill_of_lading presente y verificado
  - customs_declaration presente
  - attestation import_cleared presente
  - 0 excepciones blocking sin resolver

fully_cleared = import_ready AND:
  - attestation customs_released presente
```

### Función

```sql
compute_consignment_readiness(consignment_id UUID) → readiness_state
```

Se ejecuta:
- Al agregar/verificar documento
- Al crear attestation
- Al resolver excepción
- Manualmente

---

## 6. Relación con Stage 1

### Lots siguen existiendo

- Identidad física del lote
- Atributos de origen (variedad, calidad, peso, ubicación)
- Eventos locales del lote
- Trust state del lote

### Lots son subordinados

- Un lote pertenece a 0 o 1 consignaciones
- La consignación agrupa lotes para decisión de exportación
- Los atributos de lote alimentan la consignación
- Los eventos de lote son visibles desde la consignación

### Lo que cambia

| Antes (Stage 1) | Después (Stage 2) |
|-----------------|-------------------|
| Lot = objeto raíz | Lot = hijo de consignación |
| QR scan = centro | QR scan = derivado |
| Trust score = por lote | Trust score = por consignación |
| Consumer = primario | Export manager = primario |
| Marketplace = feature | Marketplace = eliminado |

---

## 7. Lo que se Elimina

### De raíz
- **Marketplace** (is_listed, marketplace page)
- **Consumer QR scanning** como feature principal
- **DEMO_DATA** cualquier residuo
- **Trust score por lote** como métrica principal (se mantiene subordinada)

### Se congela
- **batchService.ts** (ya deprecated)
- **useScanTracking.tsx** (ya deprecated)
- **Verify.tsx** como flow principal (se mantiene como utilidad)

---

## 8. Nuevas Páginas

### Para Export Manager

1. **Cases** (Dashboard de consignaciones)
   - Lista de consignment cases
   - Filtros por status, readiness
   - KPIs de readiness

2. **Case Detail** (Dossier de consignación)
   - Lotes asignados
   - Documentos con estado
   - Attestations
   - Handoffs timeline
   - Excepciones activas
   - Readiness checklist

3. **New Case** (Crear consignación)
   - Datos básicos
   - Asignar lotes
   - Upload documentos

### Para Import Compliance

4. **Incoming Cases** (Consignaciones recibidas)
   - Read-only view
   - Verificar documentos
   - Levantar excepciones

---

## 9. Las 9 Primitives del Protocolo

Sin estas, no hay protocolo.

### P1. Physical Lot
Unidad física de producto de origen.
- **Tabla:** `lots` + `lot_attributes` + `lot_events`
- **Campos clave:** lot_id, producer, origin, variety, harvest_window_start/end, base attributes

### P2. Consignment Case
Unidad operativa y económica. Objeto raíz de decisión.
- **Tabla:** `consignment_cases`
- **Campos clave:** case_number, exporter_id, destination_country, importer_id, lots[], shipment_window, current_state, risk_status

### P3. State Transition
Cambio formal de estado ligado a decisión. No narrativas bonitas.
- **Tabla:** `state_transitions`
- **Estados:** draft → evidence_collecting → docs_complete → treatment_attested → custody_continuous → import_ready → released
- **Bifurcaciones:** exception_flagged, under_review, rejected
- **Campos clave:** from_state, to_state, actor_id, reason, evidence_refs

### P4. Attestation
Declaración atribuible de un actor autorizado.
- **Tabla:** `consignment_attestations`
- **Ejemplos:** treatment_performed, supervision_completed, phyto_issued, custody_received, lab_result_attached
- **Campos clave:** actor, role, claim_type, evidence_ref, sig_method, revocation/supersession

### P5. Evidence Object
Archivo, registro o payload que soporta una afirmación. **Inmutable.**
- **Tabla:** `evidence_objects`
- **Campos clave:** evidence_type, source_system, storage_uri, content_hash (SHA-256), created_by, visibility

### P6. Custody Transfer
Evento de handoff entre actores.
- **Tabla:** `consignment_handoffs`
- **Campos clave:** from_actor, to_actor, time, location, seal_refs, container_refs, condition_notes, evidence_refs, receiver_ack

### P7. Exception
Inconsistencia o gap crítico.
- **Tabla:** `consignment_exceptions`
- **Ejemplos:** missing_document, conflicting_treatment, custody_gap, expired_certificate, unmatched_quantity
- **Campos clave:** severity (info/warning/critical/blocking), blocks_readiness, resolved_at, resolution_evidence

### P8. Anchor
Compromiso criptográfico del evidence bundle o estado. **Inmutable.**
- **Tabla:** `anchors` (off-chain record)
- **Contrato:** `MangoChainRegistry.sol` (on-chain commitment)
- **Campos clave:** anchor_type, root_hash, chain_tx, anchor_scope, version

### P9. Evidence Pack
Output portable del sistema. **No es una tabla; es un artefacto generado.**
- Human-readable, machine-readable, hash-anchored, versioned, shareable
- Generado por `evidenceService.generateEvidencePack()`
- Contiene: root_hash, input_hashes, state_snapshot, counts, anchor reference

---

## 10. Arquitectura Hybrid On-Chain / Off-Chain

### Off-Chain (Supabase)
Aquí vive **casi todo:**
- Documentos, PDFs, XML, imágenes
- Eventos completos, metadata rica
- Permisos, scoring, analytics, search
- Exception handling, audit logs
- **Infra:** Supabase Postgres + Storage privado + Edge Functions + RLS fuerte

### On-Chain (Polygon / MangoChainRegistry)
Aquí vive **solo lo que necesita neutralidad fuerte:**
- Root hashes de evidence packs
- Hashes de attestations críticas
- Hash del state snapshot
- Referencias mínimas para verificación independiente

**NO** se guarda on-chain: docs, metadata sensible, PII.

### Patrón Correcto
```
1. Sistema reúne evidencia off-chain (Supabase)
2. Calcula content hashes por evidence object (SHA-256)
3. Construye bundle hash / Merkle root por consignación
4. Genera state snapshot hash
5. Ancla root + snapshot on-chain (MangoChainRegistry.commitAnchor)
6. Tercero verifica que el pack recibido corresponde al commitment
```

### Smart Contract: MangoChainRegistry.sol
```
commitAnchor(rootHash, anchorType, scope, version) → anchorIndex
verifyHash(rootHash) → bool
getLatestAnchor(scope) → Anchor
verifyAndGet(rootHash, scope, version) → (valid, type, submitter, time)
```

---

## 11. Service Layer

| Servicio | Primitives | Responsabilidad |
|----------|-----------|-----------------|
| `consignmentService.ts` | P2, P1 (junction) | CRUD cases, lots, status, readiness |
| `documentService.ts` | P4 | Docs, attestations, completeness |
| `handoffService.ts` | P6, P7 | Custody transfers, exceptions |
| `evidenceService.ts` | P5, P3, P9 | Evidence objects, state transitions, pack generation, hashing |
| `anchorService.ts` | P8 | Off-chain anchor records, on-chain submission, verification |

---

## 12. Real Chain-of-Custody

### Actors y Roles
- **Tabla `actors`:** Identidad formal de cada participante (producer, packer, exporter, transporter, inspector, customs_agent, importer, etc.)
- **Tabla `actor_roles`:** Roles asignados por consignación. Un actor puede tener múltiples roles. Revocables.

### Signing Levels
Un custody transfer no existe de verdad solo porque un actor lo escribió.
Cada transfer debe tener al menos uno de estos niveles:

| Nivel | Significado |
|-------|------------|
| `unsigned` | Registrado pero sin firma. No cuenta como custodia real. |
| `sender_signed` | El remitente firmó la entrega. |
| `receiver_acknowledged` | El receptor confirmó recepción. |
| `dual_signed` | Ambas partes firmaron. |
| `third_party_witnessed` | Un tercero independiente atestigua. |

**Auto-computed:** El trigger `update_signing_level` determina el nivel basándose en las firmas presentes.

### Evidence Linking
Cada transfer puede enlazarse a:
- Fotos, documentos, seal records
- Timestamps, geolocation (lat/lng/accuracy)
- Evidence objects via `evidence_refs[]`

### State Snapshots
- **Tabla `state_snapshots`:** Point-in-time snapshots inmutables
- **Auto-triggered:** en cada state transition
- **Manual:** via `create_state_snapshot()` RPC
- Contiene: counts, completeness %, gap count, snapshot_hash

### Custody Continuity Score
- Computed via `compute_custody_continuity()` RPC
- Score 0-100: signed_ratio × 60 + (dual+witnessed)_ratio × 40
- Gaps = unsigned transfers + unacknowledged handoffs

---

## 13. Dos Demos, No Tres

No marketplace. No consumer scan. No wallet UX. No ahora.

### Demo 1: Compliance / Import Readiness (Principal)

**Pregunta:** "¿Esta consignación está lista para ser defendida y aceptada?"

**Servicio:** `complianceService.ts`

**Superficie:**
- Current state (decision-linked, not narrative)
- Blocking exceptions (open, severity)
- Evidence completeness (% of critical docs present)
- Attestations present/missing
- Custody continuity (score, gaps, signing levels)
- Generate evidence pack (snapshot → hash → anchor)
- Verify hash / anchor on-chain

### Demo 2: Financing / Underwriting Readiness (Secundario)

**Pregunta:** "¿Es esta consignación suficientemente verificable para adelanto, cobertura o underwriting?"

**Servicio:** `financingService.ts`

**Superficie:**
- Evidence sufficiency score
- Custody continuity score
- Unresolved exception count
- Recency of critical documents (max 90 days)
- Financing eligibility flag
- Pack export for underwriter

**Thresholds:**
- Evidence sufficiency ≥ 70%
- Custody continuity ≥ 60%
- Zero unresolved blocking exceptions
- Critical docs < 90 days old

---

## 14. Las 3 Métricas Duras

No vanity metrics.

### Métrica 1: Time to Evidence Pack
Tiempo desde solicitud de revisión hasta pack listo.

| Target | Valor |
|--------|-------|
| Baseline manual | horas |
| Target MVP | < 30 min |
| Target serio | < 10 min |

- Campos: `pack_requested_at`, `pack_generated_at`
- Servicio: `metricsService.getTimeToEvidencePack()`

### Métrica 2: Time to Third-Party Verification
Tiempo que tarda importador/auditor/underwriter en validar suficiencia.

- De revisión manual dispersa a validación en minutos
- Campos: `verification_requested_at`, `verification_completed_at`
- Servicio: `metricsService.getTimeToVerification()`

### Métrica 3: Critical Uncertainty Reduction
Porcentaje de consignaciones que llegan a decisión con cero blocking exceptions y evidencia crítica reconciliada.

**Sub-métricas:**
- `blocking_exception_rate` — % consignaciones con ≥1 blocking exception
- `evidence_completeness_rate` — avg evidence_completeness_pct
- `custody_gap_rate` — % consignaciones con ≥1 custody gap

**Score final:** % de consignaciones "limpias" (zero blockers + completeness ≥ 80% + zero gaps)

Servicio: `metricsService.getCriticalUncertaintyReduction()`

---

## 15. Service Layer (Complete)

| Servicio | Responsabilidad |
|----------|-----------------|
| `consignmentService.ts` | CRUD cases, lots, status, readiness |
| `documentService.ts` | Docs, attestations, completeness |
| `handoffService.ts` | Custody transfers, exceptions, signing, ack |
| `evidenceService.ts` | Evidence objects, state transitions, pack generation, hashing |
| `anchorService.ts` | Off-chain anchor records, on-chain submission, verification |
| `complianceService.ts` | Demo 1: compliance readiness assessment + pack generation |
| `financingService.ts` | Demo 2: financing eligibility + doc recency |
| `metricsService.ts` | 3 hard metrics: time-to-pack, time-to-verify, uncertainty reduction |

---

## 16. Decisiones Finales

1. **Consignment Case es el objeto raíz de decisión** ✅
2. **Lot es subordinado pero sigue existiendo** ✅
3. **Consumer-first está muerto** ✅
4. **Export manager es el usuario primario** ✅
5. **Readiness es computada, no manual** ✅
6. **Supabase = off-chain truth, Polygon = on-chain anchoring** ✅
7. **9 primitives definidas y con tablas/servicios** ✅
8. **Evidence objects, state transitions y anchors son inmutables** ✅
9. **Evidence Pack es artefacto generado, no tabla** ✅
10. **On-chain: solo root hashes. Nada de docs, metadata, PII** ✅
11. **Custody transfer requiere signing level ≥ sender_signed para ser real** ✅
12. **Actors con identidad formal, no solo profile_id** ✅
13. **State snapshots automáticos en cada transición** ✅
14. **Demo 1 = compliance, Demo 2 = financing. Nada más.** ✅
15. **3 métricas duras: time-to-pack, time-to-verify, uncertainty reduction** ✅
