/**
 * Tipos TypeScript para el Consignment-Centric Schema (Stage 2)
 * Objeto raíz: ConsignmentCase
 * Lot pasa a ser subordinado
 */

import type { ServiceResult } from "./lot.types";

// ============================================
// ENUMS
// ============================================

export const CONSIGNMENT_STATUS = {
  DRAFT: 'draft',
  PENDING_DOCS: 'pending_docs',
  PENDING_INSPECTION: 'pending_inspection',
  READY_TO_SHIP: 'ready_to_ship',
  IN_TRANSIT: 'in_transit',
  ARRIVED: 'arrived',
  CUSTOMS_HOLD: 'customs_hold',
  CLEARED: 'cleared',
  EXCEPTION: 'exception',
  REJECTED: 'rejected',
} as const;

export type ConsignmentStatus = typeof CONSIGNMENT_STATUS[keyof typeof CONSIGNMENT_STATUS];

export const READINESS_STATE = {
  NOT_READY: 'not_ready',
  DOCS_PENDING: 'docs_pending',
  DOCS_COMPLETE: 'docs_complete',
  INSPECTION_PENDING: 'inspection_pending',
  INSPECTION_PASSED: 'inspection_passed',
  EXPORT_READY: 'export_ready',
  IMPORT_READY: 'import_ready',
  FULLY_CLEARED: 'fully_cleared',
} as const;

export type ReadinessState = typeof READINESS_STATE[keyof typeof READINESS_STATE];

export const DOCUMENT_TYPE = {
  PHYTOSANITARY_CERT: 'phytosanitary_cert',
  CERTIFICATE_OF_ORIGIN: 'certificate_of_origin',
  BILL_OF_LADING: 'bill_of_lading',
  PACKING_LIST: 'packing_list',
  COMMERCIAL_INVOICE: 'commercial_invoice',
  QUALITY_CERT: 'quality_cert',
  FUMIGATION_CERT: 'fumigation_cert',
  TEMPERATURE_LOG: 'temperature_log',
  CUSTOMS_DECLARATION: 'customs_declaration',
  INSURANCE_CERT: 'insurance_cert',
  OTHER: 'other',
} as const;

export type DocumentType = typeof DOCUMENT_TYPE[keyof typeof DOCUMENT_TYPE];

export const ATTESTATION_TYPE = {
  QUALITY_CONFIRMED: 'quality_confirmed',
  DOCS_COMPLETE: 'docs_complete',
  INSPECTION_PASSED: 'inspection_passed',
  PHYTO_CLEARED: 'phyto_cleared',
  EXPORT_CLEARED: 'export_cleared',
  IMPORT_CLEARED: 'import_cleared',
  CUSTOMS_RELEASED: 'customs_released',
  PAYMENT_CONFIRMED: 'payment_confirmed',
} as const;

export type AttestationType = typeof ATTESTATION_TYPE[keyof typeof ATTESTATION_TYPE];

export const HANDOFF_TYPE = {
  PRODUCER_TO_PACKER: 'producer_to_packer',
  PACKER_TO_COLD_STORAGE: 'packer_to_cold_storage',
  COLD_STORAGE_TO_TRANSPORT: 'cold_storage_to_transport',
  TRANSPORT_TO_PORT: 'transport_to_port',
  PORT_TO_VESSEL: 'port_to_vessel',
  VESSEL_TO_DESTINATION_PORT: 'vessel_to_destination_port',
  DESTINATION_PORT_TO_IMPORTER: 'destination_port_to_importer',
  IMPORTER_TO_WAREHOUSE: 'importer_to_warehouse',
} as const;

export type HandoffType = typeof HANDOFF_TYPE[keyof typeof HANDOFF_TYPE];

export const EXCEPTION_TYPE = {
  DOC_MISSING: 'doc_missing',
  DOC_EXPIRED: 'doc_expired',
  INSPECTION_FAIL: 'inspection_fail',
  QUALITY_DEVIATION: 'quality_deviation',
  TEMPERATURE_BREACH: 'temperature_breach',
  CUSTOMS_HOLD: 'customs_hold',
  DAMAGE_REPORT: 'damage_report',
  DELAY: 'delay',
  REGULATORY_BLOCK: 'regulatory_block',
  PAYMENT_ISSUE: 'payment_issue',
} as const;

export type ExceptionType = typeof EXCEPTION_TYPE[keyof typeof EXCEPTION_TYPE];

export const EXCEPTION_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  BLOCKING: 'blocking',
} as const;

export type ExceptionSeverity = typeof EXCEPTION_SEVERITY[keyof typeof EXCEPTION_SEVERITY];

export const CONSIGNMENT_EVENT_CATEGORY = {
  LIFECYCLE: 'lifecycle',
  DOCUMENT: 'document',
  ATTESTATION: 'attestation',
  HANDOFF: 'handoff',
  EXCEPTION: 'exception',
  READINESS: 'readiness',
} as const;

export type ConsignmentEventCategory = typeof CONSIGNMENT_EVENT_CATEGORY[keyof typeof CONSIGNMENT_EVENT_CATEGORY];

// --- Primitive 3: State Transition (decision-linked states) ---

export const CASE_STATE = {
  DRAFT: 'draft',
  EVIDENCE_COLLECTING: 'evidence_collecting',
  DOCS_COMPLETE: 'docs_complete',
  TREATMENT_ATTESTED: 'treatment_attested',
  CUSTODY_CONTINUOUS: 'custody_continuous',
  IMPORT_READY: 'import_ready',
  EXCEPTION_FLAGGED: 'exception_flagged',
  UNDER_REVIEW: 'under_review',
  RELEASED: 'released',
  REJECTED: 'rejected',
} as const;

export type CaseState = typeof CASE_STATE[keyof typeof CASE_STATE];

// --- Primitive 5: Evidence Object ---

export const EVIDENCE_TYPE = {
  DOCUMENT: 'document',
  PHOTO: 'photo',
  LAB_RESULT: 'lab_result',
  SENSOR_DATA: 'sensor_data',
  CERTIFICATE: 'certificate',
  DECLARATION: 'declaration',
  INSPECTION_REPORT: 'inspection_report',
  TREATMENT_RECORD: 'treatment_record',
  TRANSPORT_LOG: 'transport_log',
  SEAL_RECORD: 'seal_record',
  ACKNOWLEDGMENT: 'acknowledgment',
  OTHER: 'other',
} as const;

export type EvidenceType = typeof EVIDENCE_TYPE[keyof typeof EVIDENCE_TYPE];

export const EVIDENCE_VISIBILITY = {
  PUBLIC: 'public',
  PARTICIPANTS: 'participants',
  RESTRICTED: 'restricted',
  INTERNAL: 'internal',
} as const;

export type EvidenceVisibility = typeof EVIDENCE_VISIBILITY[keyof typeof EVIDENCE_VISIBILITY];

// --- Primitive 8: Anchor ---

export const ANCHOR_TYPE = {
  EVIDENCE_PACK: 'evidence_pack',
  ATTESTATION: 'attestation',
  STATE_SNAPSHOT: 'state_snapshot',
  CUSTODY_CHAIN: 'custody_chain',
  FULL_CONSIGNMENT: 'full_consignment',
} as const;

export type AnchorType = typeof ANCHOR_TYPE[keyof typeof ANCHOR_TYPE];

export const SIGNATURE_METHOD = {
  PLATFORM_AUTH: 'platform_auth',
  WALLET_SIGNATURE: 'wallet_signature',
  QUALIFIED_ELECTRONIC: 'qualified_electronic',
  MANUAL_UPLOAD: 'manual_upload',
  API_TOKEN: 'api_token',
} as const;

export type SignatureMethod = typeof SIGNATURE_METHOD[keyof typeof SIGNATURE_METHOD];

// ============================================
// ENTIDADES
// ============================================

export interface ConsignmentCase {
  id: string;
  case_number: string;
  exporter_id: string;
  importer_id: string | null;
  destination_country: string;
  destination_port: string | null;
  incoterm: string | null;
  status: ConsignmentStatus;
  readiness: ReadinessState;
  current_state: CaseState;
  risk_status: string;
  total_pallets: number;
  total_kg: number;
  estimated_departure: string | null;
  shipment_window_start: string | null;
  shipment_window_end: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConsignmentLot {
  id: string;
  consignment_id: string;
  lot_id: string;
  sequence_number: number;
  notes: string | null;
  created_at: string;
}

export interface ConsignmentDocument {
  id: string;
  consignment_id: string;
  doc_type: DocumentType;
  title: string;
  file_url: string | null;
  file_hash: string | null;
  issued_by: string | null;
  issued_at: string | null;
  expires_at: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ConsignmentAttestation {
  id: string;
  consignment_id: string;
  att_type: AttestationType;
  claim_type: string | null;
  attested_by: string;
  role_at_time: string;
  statement: string | null;
  evidence_refs: string[];
  sig_method: SignatureMethod;
  attested_at: string;
  revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  superseded_by: string | null;
  supersedes: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ConsignmentHandoff {
  id: string;
  consignment_id: string;
  from_party_id: string | null;
  to_party_id: string | null;
  ho_type: HandoffType;
  location: string | null;
  occurred_at: string;
  condition_notes: string | null;
  temperature_c: number | null;
  evidence_refs: string[];
  seal_refs: string[] | null;
  container_refs: string[] | null;
  receiver_ack: boolean;
  receiver_ack_at: string | null;
  receiver_ack_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ConsignmentException {
  id: string;
  consignment_id: string;
  exc_type: ExceptionType;
  severity: ExceptionSeverity;
  title: string;
  description: string | null;
  raised_by: string;
  raised_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution: string | null;
  blocks_readiness: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ConsignmentEvent {
  id: string;
  consignment_id: string;
  event_type: string;
  event_category: ConsignmentEventCategory;
  actor_id: string | null;
  description: string | null;
  location: string | null;
  ref_id: string | null;
  metadata: Record<string, any>;
  occurred_at: string;
  created_at: string;
}

// ============================================
// AGGREGATES / VIEWS
// ============================================

export interface ConsignmentWithDetails {
  case_uuid: string;
  case_number: string;
  exporter_name: string | null;
  importer_name: string | null;
  destination_country: string;
  destination_port: string | null;
  incoterm: string | null;
  status: ConsignmentStatus;
  readiness: ReadinessState;
  total_pallets: number;
  total_kg: number;
  estimated_departure: string | null;
  created_at: string;
  lot_count: number;
  doc_count: number;
  verified_doc_count: number;
  attestation_count: number;
  open_exceptions: number;
  blocking_exceptions: number;
}

export interface ReadinessChecklist {
  has_lots: boolean;
  has_phytosanitary: boolean;
  has_origin_cert: boolean;
  has_packing_list: boolean;
  has_commercial_invoice: boolean;
  has_bill_of_lading: boolean;
  has_customs_declaration: boolean;
  att_quality_confirmed: boolean;
  att_docs_complete: boolean;
  att_export_cleared: boolean;
  att_import_cleared: boolean;
  att_customs_released: boolean;
  blocking_exceptions: number;
  computed_readiness: ReadinessState;
}

// ============================================
// PAYLOADS
// ============================================

export interface CreateConsignmentPayload {
  case_number: string;
  exporter_id: string;
  destination_country: string;
  destination_port?: string;
  incoterm?: string;
  estimated_departure?: string;
  importer_id?: string;
}

export interface AddLotPayload {
  consignment_id: string;
  lot_id: string;
  sequence_number?: number;
  notes?: string;
}

export interface UploadDocumentPayload {
  consignment_id: string;
  doc_type: DocumentType;
  title: string;
  file_url?: string;
  file_hash?: string;
  issued_by?: string;
  issued_at?: string;
  expires_at?: string;
}

export interface CreateAttestationPayload {
  consignment_id: string;
  att_type: AttestationType;
  claim_type?: string;
  attested_by: string;
  role_at_time: string;
  statement?: string;
  evidence_refs?: string[];
  sig_method?: SignatureMethod;
  supersedes?: string;
}

export interface LogHandoffPayload {
  consignment_id: string;
  from_party_id?: string;
  to_party_id?: string;
  ho_type: HandoffType;
  location?: string;
  occurred_at?: string;
  condition_notes?: string;
  temperature_c?: number;
  evidence_refs?: string[];
  seal_refs?: string[];
  container_refs?: string[];
}

export interface RaiseExceptionPayload {
  consignment_id: string;
  exc_type: ExceptionType;
  severity: ExceptionSeverity;
  title: string;
  description?: string;
  raised_by: string;
  blocks_readiness?: boolean;
}

export interface ResolveExceptionPayload {
  exception_id: string;
  resolved_by: string;
  resolution: string;
}

// ============================================
// PRIMITIVE 5: Evidence Object
// ============================================

export interface EvidenceObject {
  id: string;
  consignment_id: string | null;
  lot_id: string | null;
  evidence_type: EvidenceType;
  source_system: string;
  storage_uri: string | null;
  content_hash: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_by: string;
  visibility: EvidenceVisibility;
  title: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================
// PRIMITIVE 3: State Transition
// ============================================

export interface StateTransition {
  id: string;
  consignment_id: string;
  from_state: CaseState | null;
  to_state: CaseState;
  actor_id: string;
  reason: string | null;
  evidence_refs: string[];
  metadata: Record<string, any>;
  transitioned_at: string;
  created_at: string;
}

// ============================================
// PRIMITIVE 8: Anchor
// ============================================

export interface Anchor {
  id: string;
  consignment_id: string;
  anchor_type: AnchorType;
  root_hash: string;
  anchored_at: string;
  chain_tx: string | null;
  chain_id: number | null;
  contract_address: string | null;
  anchor_scope: Record<string, any>;
  input_hashes: string[];
  version: number;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================
// PRIMITIVE 9: Evidence Pack (generated artifact)
// ============================================

export interface EvidencePack {
  consignment_id: string;
  case_number: string;
  version: number;
  generated_at: string;
  root_hash: string;
  input_hashes: string[];
  anchor: Anchor | null;
  state_snapshot: {
    current_state: CaseState;
    readiness: ReadinessState;
    risk_status: string;
  };
  evidence_count: number;
  attestation_count: number;
  handoff_count: number;
  exception_summary: {
    total: number;
    open: number;
    blocking: number;
  };
}

// ============================================
// NEW PAYLOADS
// ============================================

export interface CreateEvidencePayload {
  consignment_id?: string;
  lot_id?: string;
  evidence_type: EvidenceType;
  source_system?: string;
  storage_uri?: string;
  content_hash: string;
  file_size_bytes?: number;
  mime_type?: string;
  created_by: string;
  visibility?: EvidenceVisibility;
  title?: string;
  description?: string;
}

export interface TransitionStatePayload {
  consignment_id: string;
  to_state: CaseState;
  actor_id: string;
  reason?: string;
  evidence_refs?: string[];
}

export interface CreateAnchorPayload {
  consignment_id: string;
  anchor_type: AnchorType;
  root_hash: string;
  chain_tx?: string;
  chain_id?: number;
  contract_address?: string;
  anchor_scope?: Record<string, any>;
  input_hashes?: string[];
  version: number;
}

// ============================================
// ACTORS (Primitive: formal actor identity)
// ============================================

export const ACTOR_TYPE = {
  PRODUCER: 'producer',
  PACKER: 'packer',
  EXPORTER: 'exporter',
  TRANSPORTER: 'transporter',
  COLD_STORAGE: 'cold_storage',
  PORT_OPERATOR: 'port_operator',
  CUSTOMS_AGENT: 'customs_agent',
  INSPECTOR: 'inspector',
  FUMIGATOR: 'fumigator',
  LAB_ANALYST: 'lab_analyst',
  VESSEL_OPERATOR: 'vessel_operator',
  IMPORTER: 'importer',
  WAREHOUSE_OPERATOR: 'warehouse_operator',
  AUDITOR: 'auditor',
  INSURER: 'insurer',
  FINANCIER: 'financier',
  REGULATORY_AUTHORITY: 'regulatory_authority',
} as const;

export type ActorType = typeof ACTOR_TYPE[keyof typeof ACTOR_TYPE];

export const CUSTODY_SIGNING_LEVEL = {
  UNSIGNED: 'unsigned',
  SENDER_SIGNED: 'sender_signed',
  RECEIVER_ACKNOWLEDGED: 'receiver_acknowledged',
  DUAL_SIGNED: 'dual_signed',
  THIRD_PARTY_WITNESSED: 'third_party_witnessed',
} as const;

export type CustodySigningLevel = typeof CUSTODY_SIGNING_LEVEL[keyof typeof CUSTODY_SIGNING_LEVEL];

export const SNAPSHOT_TRIGGER = {
  STATE_TRANSITION: 'state_transition',
  EVIDENCE_PACK_REQUEST: 'evidence_pack_request',
  MANUAL: 'manual',
  ANCHOR_COMMIT: 'anchor_commit',
  EXCEPTION_RAISED: 'exception_raised',
  EXCEPTION_RESOLVED: 'exception_resolved',
  PERIODIC: 'periodic',
} as const;

export type SnapshotTrigger = typeof SNAPSHOT_TRIGGER[keyof typeof SNAPSHOT_TRIGGER];

export interface Actor {
  id: string;
  profile_id: string | null;
  display_name: string;
  legal_name: string | null;
  actor_type: ActorType;
  organization: string | null;
  tax_id: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ActorRole {
  id: string;
  actor_id: string;
  consignment_id: string;
  role_name: string;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface StateSnapshot {
  id: string;
  consignment_id: string;
  trigger_type: SnapshotTrigger;
  triggered_by: string | null;
  snapshot_hash: string;
  snapshot_data: Record<string, any>;
  current_state: string;
  evidence_count: number;
  attestation_count: number;
  handoff_count: number;
  open_exceptions: number;
  blocking_exceptions: number;
  evidence_completeness_pct: number;
  custody_gap_count: number;
  created_at: string;
}

// ============================================
// CUSTODY TRANSFER (refined with signing levels)
// ============================================

export interface CustodyTransferFull extends ConsignmentHandoff {
  signing_level: CustodySigningLevel;
  sender_signed_at: string | null;
  sender_sig_method: string | null;
  receiver_sig_method: string | null;
  witness_id: string | null;
  witness_signed_at: string | null;
  witness_sig_method: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_accuracy_m: number | null;
  from_actor_id: string | null;
  to_actor_id: string | null;
}

// ============================================
// METRICS (3 hard metrics)
// ============================================

export interface CustodyContinuity {
  total_handoffs: number;
  signed_handoffs: number;
  dual_signed: number;
  witnessed: number;
  unsigned_handoffs: number;
  custody_gaps: number;
  continuity_score: number;
}

export interface EvidenceCompleteness {
  total_required: number;
  total_present: number;
  total_verified: number;
  completeness_pct: number;
  missing_critical: string[];
}

export interface TimeToEvidencePack {
  pack_requested_at: string | null;
  pack_generated_at: string | null;
  duration_minutes: number | null;
}

export interface TimeToVerification {
  verification_requested_at: string | null;
  verification_completed_at: string | null;
  duration_minutes: number | null;
}

export interface CriticalUncertaintyReduction {
  blocking_exception_rate: number;
  evidence_completeness_rate: number;
  custody_gap_rate: number;
  consignments_with_zero_blockers: number;
  total_consignments: number;
  uncertainty_reduction_pct: number;
}

// ============================================
// COMPLIANCE VIEW (Demo 1)
// ============================================

export interface ComplianceReadiness {
  consignment_id: string;
  case_number: string;
  current_state: CaseState;
  blocking_exceptions: ConsignmentException[];
  evidence_completeness: EvidenceCompleteness;
  attestations_present: string[];
  attestations_missing: string[];
  custody_continuity: CustodyContinuity;
  can_generate_pack: boolean;
  last_anchor: Anchor | null;
  last_snapshot: StateSnapshot | null;
}

// ============================================
// FINANCING VIEW (Demo 2)
// ============================================

export interface FinancingReadiness {
  consignment_id: string;
  case_number: string;
  evidence_sufficiency_score: number;
  custody_continuity_score: number;
  unresolved_exception_count: number;
  critical_doc_recency: Record<string, string | null>;
  financing_eligible: boolean;
  eligibility_reasons: string[];
  disqualifiers: string[];
}

// ============================================
// PAYLOADS (new)
// ============================================

export interface CreateActorPayload {
  display_name: string;
  legal_name?: string;
  actor_type: ActorType;
  organization?: string;
  tax_id?: string;
  country?: string;
  contact_email?: string;
  contact_phone?: string;
  profile_id?: string;
}

export interface AssignActorRolePayload {
  actor_id: string;
  consignment_id: string;
  role_name: string;
  granted_by?: string;
}

export interface SignHandoffPayload {
  handoff_id: string;
  signer_type: 'sender' | 'receiver' | 'witness';
  sig_method: string;
  actor_id?: string;
  geo_lat?: number;
  geo_lng?: number;
  geo_accuracy_m?: number;
}

// Re-export ServiceResult for convenience
export type { ServiceResult };
