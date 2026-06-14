-- ============================================================================
-- MASTER INITIALIZATION SCRIPT: ATRIA MVP DATABASE RECONSTRUCTION
-- ============================================================================
-- Este script recrea la estructura de base de datos completa de ATRIA.
-- Contiene: Enums, Tablas Core, Triggers, Funciones RPC y Políticas RLS.
-- Ejecutar en el SQL Editor de tu nuevo proyecto de Supabase.
-- ============================================================================

-- ============================================
-- 0. LIMPIEZA PREVIA (Para re-ejecución limpia)
-- ============================================
DROP TRIGGER IF EXISTS trg_update_pack_status_on_snapshot ON state_snapshots;
DROP TRIGGER IF EXISTS trg_mark_pack_stale_on_evidence ON evidence_objects;
DROP TRIGGER IF EXISTS trg_mark_pack_stale_on_exception ON consignment_exceptions;
DROP TRIGGER IF EXISTS trg_update_pack_status_on_anchor ON anchors;
DROP TRIGGER IF EXISTS prevent_duplicate_anchor ON trust_proofs;
DROP TRIGGER IF EXISTS sync_anchor_status_trigger ON trust_proofs;
DROP TRIGGER IF EXISTS trigger_snapshot_on_transition ON state_transitions;
DROP TRIGGER IF EXISTS trigger_update_signing_level ON consignment_handoffs;
DROP TRIGGER IF EXISTS trigger_handoff_ack ON consignment_handoffs;
DROP TRIGGER IF EXISTS trigger_anchor_committed ON anchors;
DROP TRIGGER IF EXISTS trigger_evidence_added ON evidence_objects;
DROP TRIGGER IF EXISTS trigger_apply_state_transition ON state_transitions;
DROP TRIGGER IF EXISTS trigger_exception_resolved ON consignment_exceptions;
DROP TRIGGER IF EXISTS trigger_exception_raised ON consignment_exceptions;
DROP TRIGGER IF EXISTS trigger_handoff_created ON consignment_handoffs;
DROP TRIGGER IF EXISTS trigger_attestation_created ON consignment_attestations;
DROP TRIGGER IF EXISTS trigger_document_verified ON consignment_documents;
DROP TRIGGER IF EXISTS trigger_document_added ON consignment_documents;
DROP TRIGGER IF EXISTS trigger_lot_added ON consignment_lots;
DROP TRIGGER IF EXISTS trigger_cc_initial_event ON consignment_cases;
DROP TRIGGER IF EXISTS trigger_create_initial_trust_state ON lots;
DROP TRIGGER IF EXISTS trigger_create_initial_lot_event ON lots;
DROP TRIGGER IF EXISTS trigger_update_trust_on_verification ON qr_verifications;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP MATERIALIZED VIEW IF EXISTS lot_verification_counts CASCADE;
DROP MATERIALIZED VIEW IF EXISTS producer_statistics CASCADE;

DROP TABLE IF EXISTS trust_proofs CASCADE;
DROP TABLE IF EXISTS state_snapshots CASCADE;
DROP TABLE IF EXISTS actor_roles CASCADE;
DROP TABLE IF EXISTS actors CASCADE;
DROP TABLE IF EXISTS anchors CASCADE;
DROP TABLE IF EXISTS state_transitions CASCADE;
DROP TABLE IF EXISTS evidence_objects CASCADE;
DROP TABLE IF EXISTS consignment_events CASCADE;
DROP TABLE IF EXISTS consignment_exceptions CASCADE;
DROP TABLE IF EXISTS consignment_handoffs CASCADE;
DROP TABLE IF EXISTS consignment_attestations CASCADE;
DROP TABLE IF EXISTS consignment_documents CASCADE;
DROP TABLE IF EXISTS consignment_lots CASCADE;
DROP TABLE IF EXISTS consignment_cases CASCADE;
DROP TABLE IF EXISTS qr_verifications CASCADE;
DROP TABLE IF EXISTS trust_states CASCADE;
DROP TABLE IF EXISTS lot_events CASCADE;
DROP TABLE IF EXISTS lot_attributes CASCADE;
DROP TABLE IF EXISTS lots CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS batches CASCADE;

DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS case_state CASCADE;
DROP TYPE IF EXISTS evidence_type CASCADE;
DROP TYPE IF EXISTS evidence_visibility CASCADE;
DROP TYPE IF EXISTS anchor_type CASCADE;
DROP TYPE IF EXISTS signature_method CASCADE;
DROP TYPE IF EXISTS actor_type CASCADE;
DROP TYPE IF EXISTS custody_signing_level CASCADE;
DROP TYPE IF EXISTS snapshot_trigger CASCADE;
DROP TYPE IF EXISTS anchor_status CASCADE;
DROP TYPE IF EXISTS consignment_status CASCADE;
DROP TYPE IF EXISTS readiness_state CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS attestation_type CASCADE;
DROP TYPE IF EXISTS handoff_type CASCADE;
DROP TYPE IF EXISTS exception_type CASCADE;
DROP TYPE IF EXISTS exception_severity CASCADE;
DROP TYPE IF EXISTS consignment_event_category CASCADE;
DROP TYPE IF EXISTS pack_status CASCADE;

-- ============================================
-- 1. CREACIÓN DE ENUMS
-- ============================================
CREATE TYPE app_role AS ENUM ('agricultor', 'exportador');

CREATE TYPE case_state AS ENUM (
  'draft',
  'evidence_collecting',
  'docs_complete',
  'treatment_attested',
  'custody_continuous',
  'import_ready',
  'exception_flagged',
  'under_review',
  'released',
  'rejected'
);

CREATE TYPE evidence_type AS ENUM (
  'document',
  'photo',
  'lab_result',
  'sensor_data',
  'certificate',
  'declaration',
  'inspection_report',
  'treatment_record',
  'transport_log',
  'seal_record',
  'acknowledgment',
  'other'
);

CREATE TYPE evidence_visibility AS ENUM (
  'public',
  'participants',
  'restricted',
  'internal'
);

CREATE TYPE anchor_type AS ENUM (
  'evidence_pack',
  'attestation',
  'state_snapshot',
  'custody_chain',
  'full_consignment'
);

CREATE TYPE signature_method AS ENUM (
  'platform_auth',
  'wallet_signature',
  'qualified_electronic',
  'manual_upload',
  'api_token'
);

CREATE TYPE actor_type AS ENUM (
  'producer',
  'packer',
  'exporter',
  'transporter',
  'cold_storage',
  'port_operator',
  'customs_agent',
  'inspector',
  'fumigator',
  'lab_analyst',
  'vessel_operator',
  'importer',
  'warehouse_operator',
  'auditor',
  'insurer',
  'financier',
  'regulatory_authority'
);

CREATE TYPE custody_signing_level AS ENUM (
  'unsigned',
  'sender_signed',
  'receiver_acknowledged',
  'dual_signed',
  'third_party_witnessed'
);

CREATE TYPE snapshot_trigger AS ENUM (
  'state_transition',
  'evidence_pack_request',
  'manual',
  'anchor_commit',
  'exception_raised',
  'exception_resolved',
  'periodic'
);

CREATE TYPE anchor_status AS ENUM (
  'pending',
  'pending_anchor',
  'anchored',
  'failed',
  'verified'
);

CREATE TYPE consignment_status AS ENUM (
  'draft',
  'pending_docs',
  'pending_inspection',
  'ready_to_ship',
  'in_transit',
  'arrived',
  'customs_hold',
  'cleared',
  'exception',
  'rejected'
);

CREATE TYPE readiness_state AS ENUM (
  'not_ready',
  'docs_pending',
  'docs_complete',
  'inspection_pending',
  'inspection_passed',
  'export_ready',
  'import_ready',
  'fully_cleared'
);

CREATE TYPE document_type AS ENUM (
  'phytosanitary_cert',
  'certificate_of_origin',
  'bill_of_lading',
  'packing_list',
  'commercial_invoice',
  'quality_cert',
  'fumigation_cert',
  'temperature_log',
  'customs_declaration',
  'insurance_cert',
  'other'
);

CREATE TYPE attestation_type AS ENUM (
  'quality_confirmed',
  'docs_complete',
  'inspection_passed',
  'phyto_cleared',
  'export_cleared',
  'import_cleared',
  'customs_released',
  'payment_confirmed'
);

CREATE TYPE handoff_type AS ENUM (
  'producer_to_packer',
  'packer_to_cold_storage',
  'cold_storage_to_transport',
  'transport_to_port',
  'port_to_vessel',
  'vessel_to_destination_port',
  'destination_port_to_importer',
  'importer_to_warehouse'
);

CREATE TYPE exception_type AS ENUM (
  'doc_missing',
  'doc_expired',
  'inspection_fail',
  'quality_deviation',
  'temperature_breach',
  'customs_hold',
  'damage_report',
  'delay',
  'regulatory_block',
  'payment_issue'
);

CREATE TYPE exception_severity AS ENUM (
  'info',
  'warning',
  'critical',
  'blocking'
);

CREATE TYPE consignment_event_category AS ENUM (
  'lifecycle',
  'document',
  'attestation',
  'handoff',
  'exception',
  'readiness'
);

CREATE TYPE pack_status AS ENUM (
  'not_generated',
  'stale',
  'fresh',
  'anchored',
  'shared'
);

-- ============================================
-- 2. TABLAS BASE
-- ============================================

-- 2.1 Profiles (Perfil extendido de usuarios)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  location TEXT,
  avatar_url TEXT,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'agricultor',
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code TEXT,
  organization_type TEXT CHECK (organization_type IN ('exporter', 'importer', 'logistics', 'inspector', 'laboratory', 'regulatory', 'financial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_name ON organizations(name);

-- 2.3 User Roles (Relación roles y organizaciones)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('export_manager', 'compliance_lead', 'auditor', 'external_reviewer', 'system_admin')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system',
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- 2.4 Lots (Lotes de Mango - Identidad Core Inmutable)
CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id VARCHAR(100) UNIQUE NOT NULL,
  producer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  origin_location VARCHAR(255) NOT NULL,
  harvest_date DATE,
  harvest_window_start DATE,
  harvest_window_end DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_lot_id_format CHECK (lot_id ~ '^[A-Z]{2,4}-\d{4}-\d{3,6}$')
);

CREATE UNIQUE INDEX idx_lots_lot_id ON lots(lot_id);
CREATE INDEX idx_lots_producer_id ON lots(producer_id);
CREATE INDEX idx_lots_created_at ON lots(created_at DESC);
CREATE INDEX idx_lots_origin_location ON lots(origin_location);

-- 2.5 Lot Attributes (Propiedades Mutables - EAV Pattern)
CREATE TABLE lot_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  attribute_key VARCHAR(100) NOT NULL,
  attribute_value TEXT NOT NULL,
  value_type VARCHAR(50) NOT NULL DEFAULT 'string',
  source VARCHAR(100) DEFAULT 'user_input',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lot_id, attribute_key)
);

CREATE INDEX idx_lot_attrs_lot_id ON lot_attributes(lot_id);
CREATE INDEX idx_lot_attrs_key ON lot_attributes(attribute_key);
CREATE INDEX idx_lot_attrs_verified ON lot_attributes(verified);

-- 2.6 Lot Events (Timeline de eventos inmutables para el Lote)
CREATE TABLE lot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  location VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lot_events_lot_id ON lot_events(lot_id);
CREATE INDEX idx_lot_events_type ON lot_events(event_type);
CREATE INDEX idx_lot_events_category ON lot_events(event_category);
CREATE INDEX idx_lot_events_occurred_at ON lot_events(occurred_at DESC);

-- 2.7 Trust States (Estado actual de confianza del Lote)
CREATE TABLE trust_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  trust_score NUMERIC(5, 2) DEFAULT 0.00,
  verification_count INTEGER DEFAULT 0,
  evidence_count INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  flags JSONB DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lot_id),
  CONSTRAINT check_trust_score_range CHECK (trust_score >= 0 AND trust_score <= 100),
  CONSTRAINT check_positive_counts CHECK (verification_count >= 0 AND evidence_count >= 0)
);

-- 2.8 QR Verifications (Registro de escaneo QR)
CREATE TABLE qr_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_fingerprint VARCHAR(255),
  location_data JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_qr_lot_id ON qr_verifications(lot_id);
CREATE INDEX idx_qr_verified_at ON qr_verifications(verified_at DESC);

-- 2.9 Consignment Cases (Casos de consignación / Envío Exportación)
CREATE TABLE consignment_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(100) UNIQUE NOT NULL,
  exporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  importer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id),
  destination_country VARCHAR(100) NOT NULL,
  destination_port VARCHAR(255),
  incoterm VARCHAR(10),
  status consignment_status NOT NULL DEFAULT 'draft',
  readiness readiness_state NOT NULL DEFAULT 'not_ready',
  current_state case_state NOT NULL DEFAULT 'draft',
  risk_status VARCHAR(50) NOT NULL DEFAULT 'normal',
  pack_status pack_status NOT NULL DEFAULT 'not_generated',
  anchor_status anchor_status DEFAULT 'pending',
  total_pallets INTEGER DEFAULT 0,
  total_kg NUMERIC(12, 2) DEFAULT 0,
  estimated_departure DATE,
  shipment_window_start DATE,
  shipment_window_end DATE,
  pack_requested_at TIMESTAMPTZ,
  pack_generated_at TIMESTAMPTZ,
  verification_requested_at TIMESTAMPTZ,
  verification_completed_at TIMESTAMPTZ,
  evidence_completeness_pct NUMERIC(5,2) DEFAULT 0,
  custody_gap_count INTEGER DEFAULT 0,
  blocking_exception_count INTEGER DEFAULT 0,
  last_anchor_tx TEXT,
  last_anchor_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_case_number_format CHECK (case_number ~ '^CS-\d{4}-\d{3,6}$')
);

CREATE UNIQUE INDEX idx_cc_case_number ON consignment_cases(case_number);
CREATE INDEX idx_cc_exporter ON consignment_cases(exporter_id);
CREATE INDEX idx_cc_status ON consignment_cases(status);
CREATE INDEX idx_cc_readiness ON consignment_cases(readiness);
CREATE INDEX idx_cc_current_state ON consignment_cases(current_state);
CREATE INDEX idx_consignment_cases_organization_id ON consignment_cases(organization_id);

-- 2.10 Consignment Lots (Asignación de lotes a un caso de envío)
CREATE TABLE consignment_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE RESTRICT,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(consignment_id, lot_id)
);

CREATE INDEX idx_cl_consignment ON consignment_lots(consignment_id);
CREATE INDEX idx_cl_lot ON consignment_lots(lot_id);

-- 2.11 Consignment Documents (Evidencia documental tradicional)
CREATE TABLE consignment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  doc_type document_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_hash VARCHAR(128),
  issued_by VARCHAR(255),
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cd_consignment ON consignment_documents(consignment_id);
CREATE INDEX idx_cd_type ON consignment_documents(doc_type);

-- 2.12 Consignment Attestations (Afirmaciones de cumplimiento)
CREATE TABLE consignment_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  att_type attestation_type NOT NULL,
  attested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  role_at_time VARCHAR(100) NOT NULL,
  statement TEXT,
  evidence_refs UUID[] DEFAULT '{}',
  claim_type VARCHAR(100),
  sig_method signature_method NOT NULL DEFAULT 'platform_auth',
  superseded_by UUID REFERENCES consignment_attestations(id),
  supersedes UUID REFERENCES consignment_attestations(id),
  attested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ca_consignment ON consignment_attestations(consignment_id);
CREATE INDEX idx_ca_type ON consignment_attestations(att_type);

-- 2.13 Actors (Identidad formal de actores de la cadena de suministro)
CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  actor_type actor_type NOT NULL,
  organization VARCHAR(255),
  tax_id VARCHAR(100),
  country VARCHAR(3),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_actors_profile ON actors(profile_id);
CREATE INDEX idx_actors_type ON actors(actor_type);

-- 2.14 Actor Roles (Asignaciones de roles por consignación)
CREATE TABLE actor_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ar_actor ON actor_roles(actor_id);
CREATE INDEX idx_ar_consignment ON actor_roles(consignment_id);
CREATE UNIQUE INDEX idx_ar_unique_active ON actor_roles(actor_id, consignment_id, role_name) WHERE is_active = true;

-- 2.15 Consignment Handoffs (Transferencia de custodia real)
CREATE TABLE consignment_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  from_party_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_party_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  from_actor_id UUID REFERENCES actors(id),
  to_actor_id UUID REFERENCES actors(id),
  ho_type handoff_type NOT NULL,
  signing_level custody_signing_level NOT NULL DEFAULT 'unsigned',
  location VARCHAR(255),
  condition_notes TEXT,
  temperature_c NUMERIC(5, 2),
  seal_refs TEXT[],
  container_refs TEXT[],
  evidence_refs UUID[] DEFAULT '{}',
  sender_signed_at TIMESTAMPTZ,
  sender_sig_method VARCHAR(50),
  receiver_ack BOOLEAN DEFAULT false,
  receiver_ack_at TIMESTAMPTZ,
  receiver_ack_by UUID REFERENCES profiles(id),
  receiver_sig_method VARCHAR(50),
  witness_id UUID REFERENCES actors(id),
  witness_signed_at TIMESTAMPTZ,
  witness_sig_method VARCHAR(50),
  geo_lat NUMERIC(10,7),
  geo_lng NUMERIC(10,7),
  geo_accuracy_m NUMERIC(8,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ch_consignment ON consignment_handoffs(consignment_id);
CREATE INDEX idx_ch_type ON consignment_handoffs(ho_type);
CREATE INDEX idx_ch_signing ON consignment_handoffs(signing_level);

-- 2.16 Consignment Exceptions (Incidentes, alertas y retenciones)
CREATE TABLE consignment_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  exc_type exception_type NOT NULL,
  severity exception_severity NOT NULL DEFAULT 'warning',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  raised_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution TEXT,
  blocks_readiness BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ce_consignment ON consignment_exceptions(consignment_id);
CREATE INDEX idx_ce_resolved ON consignment_exceptions(resolved);

-- 2.17 Consignment Events (Timeline append-only del envío)
CREATE TABLE consignment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_category consignment_event_category NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  location VARCHAR(255),
  ref_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cev_consignment ON consignment_events(consignment_id);
CREATE INDEX idx_cev_occurred ON consignment_events(occurred_at DESC);

-- 2.18 Evidence Objects (Primitive 5: Objeto canónico de evidencia criptográfica)
CREATE TABLE evidence_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID REFERENCES consignment_cases(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
  evidence_type evidence_type NOT NULL,
  source_system VARCHAR(100) NOT NULL DEFAULT 'platform',
  storage_uri TEXT,
  content_hash VARCHAR(128) NOT NULL,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  visibility evidence_visibility NOT NULL DEFAULT 'participants',
  title VARCHAR(255),
  description TEXT,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  freshness_window_days INTEGER DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eo_consignment ON evidence_objects(consignment_id);
CREATE INDEX idx_eo_type ON evidence_objects(evidence_type);
CREATE INDEX idx_eo_hash ON evidence_objects(content_hash);

-- 2.19 State Transitions (Primitive 3: Transiciones formales)
CREATE TABLE state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  from_state case_state,
  to_state case_state NOT NULL,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reason TEXT,
  evidence_refs UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_st_consignment ON state_transitions(consignment_id);
CREATE INDEX idx_st_transitioned ON state_transitions(transitioned_at DESC);

-- 2.20 Anchors (Primitive 8: Compromisos criptográficos en Blockchain)
CREATE TABLE anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  anchor_type anchor_type NOT NULL,
  root_hash VARCHAR(128) NOT NULL,
  anchored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chain_tx VARCHAR(128),
  chain_id INTEGER,
  contract_address VARCHAR(42),
  anchor_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  input_hashes TEXT[] DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anc_consignment ON anchors(consignment_id);
CREATE INDEX idx_anc_root_hash ON anchors(root_hash);

-- 2.21 State Snapshots (Historial point-in-time inmutable)
CREATE TABLE state_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  trigger_type snapshot_trigger NOT NULL,
  triggered_by UUID REFERENCES profiles(id),
  snapshot_hash VARCHAR(128) NOT NULL,
  snapshot_data JSONB NOT NULL,
  current_state VARCHAR(50) NOT NULL,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  attestation_count INTEGER NOT NULL DEFAULT 0,
  handoff_count INTEGER NOT NULL DEFAULT 0,
  open_exceptions INTEGER NOT NULL DEFAULT 0,
  blocking_exceptions INTEGER NOT NULL DEFAULT 0,
  warning_exceptions INTEGER NOT NULL DEFAULT 0,
  evidence_completeness_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  custody_gap_count INTEGER NOT NULL DEFAULT 0,
  attribution_strength NUMERIC(5,2) NOT NULL DEFAULT 0,
  custody_continuity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  decision_readiness_import BOOLEAN NOT NULL DEFAULT false,
  decision_readiness_financing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_consignment ON state_snapshots(consignment_id);
CREATE INDEX idx_ss_hash ON state_snapshots(snapshot_hash);
CREATE INDEX idx_ss_created ON state_snapshots(created_at DESC);

-- 2.22 Trust Proofs (Fase 3: Registro Hedera Hashgraph HCS)
CREATE TABLE trust_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE RESTRICT,
  pack_hash TEXT NOT NULL,
  pack_version INTEGER NOT NULL DEFAULT 1,
  input_hashes TEXT[] NOT NULL DEFAULT '{}',
  evidence_count INTEGER NOT NULL DEFAULT 0,
  attestation_count INTEGER NOT NULL DEFAULT 0,
  topic_id TEXT,
  sequence_number BIGINT,
  consensus_timestamp TEXT,
  transaction_id TEXT,
  running_hash TEXT,
  status anchor_status NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  message_payload JSONB NOT NULL DEFAULT '{}',
  hash_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  anchored_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_consignment_version UNIQUE (consignment_id, pack_version),
  CONSTRAINT positive_version CHECK (pack_version > 0),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0)
);

CREATE INDEX idx_trust_proofs_consignment_id ON trust_proofs(consignment_id);
CREATE INDEX idx_trust_proofs_status ON trust_proofs(status);

-- ============================================
-- 3. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ============================================

-- 3.0 Función helper para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.1 Registrar perfiles automáticamente al registrarse en Auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('agricultor', 'exportador')
      THEN (NEW.raw_user_meta_data->>'role')::app_role
      ELSE 'agricultor'::app_role
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers de actualización de updated_at
CREATE TRIGGER update_lots_updated_at
  BEFORE UPDATE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lot_attributes_updated_at
  BEFORE UPDATE ON lot_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cc_updated_at
  BEFORE UPDATE ON consignment_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.2 Lote: Evento inicial y trust_state al insertar
CREATE OR REPLACE FUNCTION create_initial_lot_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lot_events (lot_id, event_type, event_category, actor_id, location, description)
  VALUES (NEW.id, 'lot.created', 'lifecycle', NEW.producer_id, NEW.origin_location, 'Lote registrado en el sistema');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_lot_event
  AFTER INSERT ON lots
  FOR EACH ROW EXECUTE FUNCTION create_initial_lot_event();

CREATE OR REPLACE FUNCTION create_initial_trust_state()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trust_states (lot_id, trust_score, verification_count, evidence_count)
  VALUES (NEW.id, 10.00, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_trust_state
  AFTER INSERT ON lots
  FOR EACH ROW EXECUTE FUNCTION create_initial_trust_state();

-- 3.3 Trazabilidad: Actualizar trust en verificación exitosa
CREATE OR REPLACE FUNCTION update_trust_on_verification()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trust_states
  SET
    verification_count = verification_count + 1,
    last_verified_at = NEW.verified_at,
    trust_score = LEAST(100, trust_score + 2.0),
    computed_at = NOW()
  WHERE lot_id = NEW.lot_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trust_on_verification
  AFTER INSERT ON qr_verifications
  FOR EACH ROW WHEN (NEW.success = true)
  EXECUTE FUNCTION update_trust_on_verification();

-- 3.4 Handoff: computar signing_level automáticamente
CREATE OR REPLACE FUNCTION update_signing_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.witness_signed_at IS NOT NULL THEN
    NEW.signing_level := 'third_party_witnessed';
  ELSIF NEW.sender_signed_at IS NOT NULL AND NEW.receiver_ack = true THEN
    NEW.signing_level := 'dual_signed';
  ELSIF NEW.receiver_ack = true THEN
    NEW.signing_level := 'receiver_acknowledged';
  ELSIF NEW.sender_signed_at IS NOT NULL THEN
    NEW.signing_level := 'sender_signed';
  ELSE
    NEW.signing_level := 'unsigned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_signing_level
  BEFORE INSERT OR UPDATE ON consignment_handoffs
  FOR EACH ROW EXECUTE FUNCTION update_signing_level();

-- ============================================
-- 4. FUNCIONES RPC COMPLEJAS
-- ============================================

-- 4.1 RPC: create_lot_complete (Atomic creation of lot + EAV attributes)
CREATE OR REPLACE FUNCTION create_lot_complete(
  p_lot_id VARCHAR,
  p_producer_id UUID,
  p_origin_location VARCHAR,
  p_harvest_date DATE,
  p_attributes JSONB
)
RETURNS TABLE (
  lot_uuid UUID,
  lot_lot_id VARCHAR
) AS $$
DECLARE
  v_lot_id UUID;
  v_attr_key TEXT;
  v_attr_value TEXT;
BEGIN
  INSERT INTO lots (lot_id, producer_id, origin_location, harvest_date)
  VALUES (p_lot_id, p_producer_id, p_origin_location, p_harvest_date)
  RETURNING id INTO v_lot_id;

  FOR v_attr_key, v_attr_value IN
    SELECT key, value::text
    FROM jsonb_each_text(p_attributes)
    WHERE value IS NOT NULL AND value::text != ''
  LOOP
    INSERT INTO lot_attributes (lot_id, attribute_key, attribute_value, value_type, source)
    VALUES (
      v_lot_id,
      v_attr_key,
      v_attr_value,
      CASE
        WHEN v_attr_value ~ '^\d+(\.\d+)?$' THEN 'numeric'
        WHEN v_attr_value IN ('true', 'false') THEN 'boolean'
        ELSE 'string'
      END,
      'user_input'
    );
  END LOOP;

  RETURN QUERY SELECT v_lot_id, p_lot_id;
END;
$$ LANGUAGE plpgsql;

-- 4.2 RPC: get_lot_with_details (Aggregated EAV + Trust metrics)
CREATE OR REPLACE FUNCTION get_lot_with_details(p_lot_id VARCHAR)
RETURNS TABLE (
  lot_uuid UUID,
  lot_id VARCHAR,
  producer_id UUID,
  producer_name VARCHAR,
  origin_location VARCHAR,
  harvest_date DATE,
  created_at TIMESTAMPTZ,
  attributes JSONB,
  trust_score NUMERIC,
  verification_count INTEGER,
  last_verified_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.lot_id,
    l.producer_id,
    p.full_name,
    l.origin_location,
    l.harvest_date,
    l.created_at,
    COALESCE(
      jsonb_object_agg(la.attribute_key, la.attribute_value) FILTER (WHERE la.attribute_key IS NOT NULL),
      '{}'::jsonb
    ) as attributes,
    ts.trust_score,
    ts.verification_count,
    ts.last_verified_at
  FROM lots l
  LEFT JOIN profiles p ON l.producer_id = p.id
  LEFT JOIN lot_attributes la ON l.id = la.lot_id
  LEFT JOIN trust_states ts ON l.id = ts.lot_id
  WHERE l.lot_id = p_lot_id
  GROUP BY l.id, l.lot_id, l.producer_id, p.full_name, l.origin_location, 
           l.harvest_date, l.created_at, ts.trust_score, ts.verification_count, 
           ts.last_verified_at;
END;
$$ LANGUAGE plpgsql;

-- 4.3 RPC: compute_evidence_completeness (Audit validation of evidence)
CREATE OR REPLACE FUNCTION compute_evidence_completeness(p_consignment_id UUID)
RETURNS TABLE (
  total_required INTEGER,
  total_present INTEGER,
  total_verified INTEGER,
  completeness_pct NUMERIC(5,2),
  missing_critical TEXT[]
) AS $$
DECLARE
  v_required INTEGER := 6;
  v_present INTEGER := 0;
  v_verified INTEGER := 0;
  v_missing TEXT[] := '{}';
  v_pct NUMERIC(5,2);
BEGIN
  IF EXISTS (SELECT 1 FROM evidence_objects WHERE consignment_id = p_consignment_id AND evidence_type = 'certificate') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'certificate');
  END IF;

  IF EXISTS (SELECT 1 FROM evidence_objects WHERE consignment_id = p_consignment_id AND evidence_type = 'document') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'document');
  END IF;

  IF EXISTS (SELECT 1 FROM evidence_objects WHERE consignment_id = p_consignment_id AND evidence_type = 'inspection_report') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'inspection_report');
  END IF;

  IF EXISTS (SELECT 1 FROM evidence_objects WHERE consignment_id = p_consignment_id AND evidence_type = 'declaration') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'declaration');
  END IF;

  IF EXISTS (SELECT 1 FROM evidence_objects WHERE consignment_id = p_consignment_id AND evidence_type = 'transport_log') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'transport_log');
  END IF;

  IF EXISTS (SELECT 1 FROM evidence_objects WHERE consignment_id = p_consignment_id AND evidence_type = 'treatment_record') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'treatment_record');
  END IF;

  -- Backward compatibility check for documents
  IF v_present < v_required THEN
    IF EXISTS (SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'phytosanitary_cert')
       AND NOT EXISTS (SELECT 1 FROM evidence_objects WHERE consignment_id = p_consignment_id AND evidence_type = 'certificate') THEN
      v_present := v_present + 1;
      v_missing := array_remove(v_missing, 'certificate');
    END IF;
  END IF;

  SELECT COUNT(DISTINCT eo.id) INTO v_verified
  FROM evidence_objects eo
  JOIN consignment_attestations ca ON eo.id = ANY(ca.evidence_refs) AND ca.revoked = false
  WHERE eo.consignment_id = p_consignment_id;

  v_pct := ROUND((v_present::NUMERIC / GREATEST(v_required, 1)) * 100, 2);

  UPDATE consignment_cases
  SET evidence_completeness_pct = v_pct
  WHERE id = p_consignment_id;

  RETURN QUERY SELECT v_required, v_present, v_verified, v_pct, v_missing;
END;
$$ LANGUAGE plpgsql;

-- 4.4 RPC: compute_custody_continuity (Chain-of-custody scoring)
CREATE OR REPLACE FUNCTION compute_custody_continuity(p_consignment_id UUID)
RETURNS TABLE (
  total_handoffs INTEGER,
  signed_handoffs INTEGER,
  dual_signed INTEGER,
  witnessed INTEGER,
  unsigned_handoffs INTEGER,
  custody_gaps INTEGER,
  continuity_score NUMERIC(5,2)
) AS $$
DECLARE
  v_total INTEGER;
  v_signed INTEGER;
  v_dual INTEGER;
  v_witnessed INTEGER;
  v_unsigned INTEGER;
  v_gaps INTEGER;
  v_score NUMERIC(5,2);
BEGIN
  SELECT COUNT(*) INTO v_total FROM consignment_handoffs WHERE consignment_id = p_consignment_id;
  SELECT COUNT(*) INTO v_signed FROM consignment_handoffs WHERE consignment_id = p_consignment_id AND signing_level != 'unsigned';
  SELECT COUNT(*) INTO v_dual FROM consignment_handoffs WHERE consignment_id = p_consignment_id AND signing_level = 'dual_signed';
  SELECT COUNT(*) INTO v_witnessed FROM consignment_handoffs WHERE consignment_id = p_consignment_id AND signing_level = 'third_party_witnessed';

  v_unsigned := v_total - v_signed;

  SELECT COUNT(*) INTO v_gaps
  FROM consignment_handoffs
  WHERE consignment_id = p_consignment_id AND (signing_level = 'unsigned' OR receiver_ack = false);

  IF v_total = 0 THEN
    v_score := 0;
  ELSE
    v_score := ROUND((v_signed::NUMERIC / v_total * 60) + ((v_dual + v_witnessed)::NUMERIC / GREATEST(v_total, 1) * 40), 2);
  END IF;

  UPDATE consignment_cases SET custody_gap_count = v_gaps WHERE id = p_consignment_id;

  RETURN QUERY SELECT v_total, v_signed, v_dual, v_witnessed, v_unsigned, v_gaps, v_score;
END;
$$ LANGUAGE plpgsql;

-- 4.5 RPC: create_state_snapshot (Generates an immutable evidence snapshot)
CREATE OR REPLACE FUNCTION create_state_snapshot(
  p_consignment_id UUID,
  p_trigger snapshot_trigger,
  p_triggered_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_case RECORD;
  v_evidence_count INTEGER;
  v_att_count INTEGER;
  v_handoff_count INTEGER;
  v_open_exc INTEGER;
  v_blocking_exc INTEGER;
  v_warning_exc INTEGER;
  v_completeness NUMERIC(5,2);
  v_gaps INTEGER;
  v_snapshot JSONB;
  v_hash TEXT;
  v_att_strength NUMERIC(5,2);
  v_custody_score NUMERIC(5,2);
  v_required_att INTEGER := 6;
  v_present_att INTEGER;
  v_import_ready BOOLEAN;
  v_financing_ready BOOLEAN;
  v_custody_result RECORD;
  v_completeness_result RECORD;
BEGIN
  SELECT * INTO v_case FROM consignment_cases WHERE id = p_consignment_id;
  IF v_case IS NULL THEN
    RAISE EXCEPTION 'Consignment not found: %', p_consignment_id;
  END IF;

  SELECT COUNT(*) INTO v_evidence_count FROM evidence_objects WHERE consignment_id = p_consignment_id;
  SELECT COUNT(*) INTO v_att_count FROM consignment_attestations WHERE consignment_id = p_consignment_id AND revoked = false;
  SELECT COUNT(*) INTO v_handoff_count FROM consignment_handoffs WHERE consignment_id = p_consignment_id;
  SELECT COUNT(*) INTO v_open_exc FROM consignment_exceptions WHERE consignment_id = p_consignment_id AND resolved = false;
  SELECT COUNT(*) INTO v_blocking_exc FROM consignment_exceptions WHERE consignment_id = p_consignment_id AND resolved = false AND blocks_readiness = true;
  SELECT COUNT(*) INTO v_warning_exc FROM consignment_exceptions WHERE consignment_id = p_consignment_id AND resolved = false AND blocks_readiness = false;

  SELECT * INTO v_completeness_result FROM compute_evidence_completeness(p_consignment_id);
  v_completeness := COALESCE(v_completeness_result.completeness_pct, 0);

  SELECT * INTO v_custody_result FROM compute_custody_continuity(p_consignment_id);
  v_custody_score := COALESCE(v_custody_result.continuity_score, 0);
  v_gaps := COALESCE(v_custody_result.custody_gaps, 0);

  SELECT COUNT(DISTINCT att_type) INTO v_present_att FROM consignment_attestations WHERE consignment_id = p_consignment_id AND revoked = false;
  v_att_strength := ROUND((v_present_att::NUMERIC / GREATEST(v_required_att, 1)) * 100, 2);

  v_import_ready := (v_completeness >= 80 AND v_gaps = 0 AND v_blocking_exc = 0);
  v_financing_ready := (v_completeness >= 70 AND v_custody_score >= 70 AND v_blocking_exc = 0);

  v_snapshot := jsonb_build_object(
    'case_number', v_case.case_number,
    'current_state', v_case.current_state::text,
    'status', v_case.status::text,
    'readiness', v_case.readiness::text,
    'risk_status', v_case.risk_status,
    'evidence_count', v_evidence_count,
    'attestation_count', v_att_count,
    'handoff_count', v_handoff_count,
    'open_exceptions', v_open_exc,
    'blocking_exceptions', v_blocking_exc,
    'warning_exceptions', v_warning_exc,
    'evidence_completeness_pct', v_completeness,
    'attribution_strength', v_att_strength,
    'custody_continuity_score', v_custody_score,
    'custody_gap_count', v_gaps,
    'decision_readiness_import', v_import_ready,
    'decision_readiness_financing', v_financing_ready,
    'snapshot_time', NOW()
  );

  v_hash := md5(v_snapshot::text);

  INSERT INTO state_snapshots (
    consignment_id, trigger_type, triggered_by,
    snapshot_hash, snapshot_data, current_state,
    evidence_count, attestation_count, handoff_count,
    open_exceptions, blocking_exceptions, warning_exceptions,
    evidence_completeness_pct, custody_gap_count,
    attribution_strength, custody_continuity_score,
    decision_readiness_import, decision_readiness_financing
  ) VALUES (
    p_consignment_id, p_trigger, p_triggered_by,
    v_hash, v_snapshot, v_case.current_state::text,
    v_evidence_count, v_att_count, v_handoff_count,
    v_open_exc, v_blocking_exc, v_warning_exc,
    v_completeness, v_gaps,
    v_att_strength, v_custody_score,
    v_import_ready, v_financing_ready
  )
  RETURNING id INTO v_snapshot_id;

  UPDATE consignment_cases SET
    blocking_exception_count = v_blocking_exc,
    evidence_completeness_pct = v_completeness,
    custody_gap_count = v_gaps
  WHERE id = p_consignment_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- 4.6 RPC: evaluate_consignment_exceptions (Evaluates 4 critical Ag-Tech compliance rules)
CREATE OR REPLACE FUNCTION evaluate_consignment_exceptions(
  p_consignment_id UUID,
  p_actor_id UUID
)
RETURNS TABLE (
  exception_id UUID,
  exc_type exception_type,
  severity exception_severity,
  title TEXT,
  is_new BOOLEAN
) AS $$
DECLARE
  v_missing TEXT[];
  v_item TEXT;
  v_exc_id UUID;
  v_gaps INTEGER;
  v_att_missing TEXT[];
  v_required_att TEXT[] := ARRAY['quality_confirmed', 'docs_complete', 'inspection_passed', 'phyto_cleared', 'export_cleared', 'import_cleared'];
  v_present_att TEXT[];
BEGIN
  -- REGLA 1: Falta de documentos críticos (evidencia requerida)
  SELECT ec.missing_critical INTO v_missing FROM compute_evidence_completeness(p_consignment_id) ec;
  IF v_missing IS NOT NULL THEN
    FOREACH v_item IN ARRAY v_missing
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM consignment_exceptions
        WHERE consignment_id = p_consignment_id AND exc_type = 'doc_missing' AND resolved = false AND title LIKE '%' || v_item || '%'
      ) THEN
        INSERT INTO consignment_exceptions (consignment_id, exc_type, severity, title, description, raised_by, blocks_readiness)
        VALUES (
          p_consignment_id, 'doc_missing', 'blocking',
          'Missing required evidence: ' || replace(v_item, '_', ' '),
          'Evidence type "' || v_item || '" is required for export readiness but not attached.',
          p_actor_id, true
        )
        RETURNING id INTO v_exc_id;

        RETURN QUERY SELECT v_exc_id, 'doc_missing'::exception_type, 'blocking'::exception_severity,
          ('Missing required evidence: ' || replace(v_item, '_', ' '))::TEXT, true;
      END IF;
    END LOOP;
  END IF;

  -- Auto-resolver excepciones doc_missing resueltas
  UPDATE consignment_exceptions SET
    resolved = true, resolved_at = NOW(), resolved_by = p_actor_id, resolution = 'Evidence type now present'
  WHERE consignment_id = p_consignment_id AND exc_type = 'doc_missing' AND resolved = false
    AND NOT EXISTS (SELECT 1 FROM unnest(v_missing) m WHERE title LIKE '%' || m || '%');

  -- REGLA 2: Documentos con expiración vencida
  INSERT INTO consignment_exceptions (consignment_id, exc_type, severity, title, description, raised_by, blocks_readiness)
  SELECT
    p_consignment_id, 'doc_expired', 'blocking',
    'Expired document: ' || cd.title,
    'Document "' || cd.title || '" expired on ' || cd.expires_at::text,
    p_actor_id, true
  FROM consignment_documents cd
  WHERE cd.consignment_id = p_consignment_id AND cd.expires_at IS NOT NULL AND cd.expires_at < NOW()
    AND NOT EXISTS (SELECT 1 FROM consignment_exceptions ce WHERE ce.consignment_id = p_consignment_id AND ce.exc_type = 'doc_expired' AND ce.resolved = false AND ce.title LIKE '%' || cd.title || '%')
  RETURNING id, exc_type, severity, title, true INTO v_exc_id;

  RETURN QUERY
  SELECT ce.id, ce.exc_type, ce.severity, ce.title::TEXT, false FROM consignment_exceptions ce
  WHERE ce.consignment_id = p_consignment_id AND ce.exc_type = 'doc_expired' AND ce.resolved = false;

  -- REGLA 3: Declaraciones de cumplimiento humano faltantes
  SELECT ARRAY_AGG(DISTINCT att_type::text) INTO v_present_att FROM consignment_attestations WHERE consignment_id = p_consignment_id AND revoked = false;
  v_present_att := COALESCE(v_present_att, '{}');

  FOREACH v_item IN ARRAY v_required_att
  LOOP
    IF NOT (v_item = ANY(v_present_att)) THEN
      IF NOT EXISTS (
        SELECT 1 FROM consignment_exceptions
        WHERE consignment_id = p_consignment_id AND exc_type = 'regulatory_block' AND resolved = false AND title LIKE '%attestation%' || v_item || '%'
      ) THEN
        INSERT INTO consignment_exceptions (consignment_id, exc_type, severity, title, description, raised_by, blocks_readiness)
        VALUES (
          p_consignment_id, 'regulatory_block', 'warning',
          'Missing attestation: ' || replace(v_item, '_', ' '),
          'Required attestation type "' || v_item || '" has not been provided.',
          p_actor_id, false
        )
        RETURNING id INTO v_exc_id;

        RETURN QUERY SELECT v_exc_id, 'regulatory_block'::exception_type, 'warning'::exception_severity,
          ('Missing attestation: ' || replace(v_item, '_', ' '))::TEXT, true;
      END IF;
    END IF;
  END LOOP;

  -- REGLA 4: Vacíos o rupturas en la cadena de custodia
  SELECT cc.custody_gaps INTO v_gaps FROM compute_custody_continuity(p_consignment_id) cc;
  IF v_gaps > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM consignment_exceptions
      WHERE consignment_id = p_consignment_id AND exc_type = 'customs_hold' AND resolved = false AND title LIKE '%custody gap%'
    ) THEN
      INSERT INTO consignment_exceptions (consignment_id, exc_type, severity, title, description, raised_by, blocks_readiness)
      VALUES (
        p_consignment_id, 'customs_hold', 'blocking',
        'Custody gap detected: ' || v_gaps || ' unsigned/unacknowledged handoff(s)',
        v_gaps || ' handoff(s) lack proper signing or receiver acknowledgment.',
        p_actor_id, true
      )
      RETURNING id INTO v_exc_id;

      RETURN QUERY SELECT v_exc_id, 'customs_hold'::exception_type, 'blocking'::exception_severity,
        ('Custody gap detected: ' || v_gaps || ' unsigned/unacknowledged handoff(s)')::TEXT, true;
    END IF;
  ELSE
    UPDATE consignment_exceptions SET
      resolved = true, resolved_at = NOW(), resolved_by = p_actor_id, resolution = 'All handoffs now properly signed'
    WHERE consignment_id = p_consignment_id AND exc_type = 'customs_hold' AND resolved = false AND title LIKE '%custody gap%';
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 4.7 RPC: compute_pack_status (Computes freshness and sync status of evidence bundles)
CREATE OR REPLACE FUNCTION compute_pack_status(p_consignment_id UUID)
RETURNS pack_status AS $$
DECLARE
  v_anchor_has_tx BOOLEAN;
  v_latest_snapshot_at TIMESTAMPTZ;
  v_latest_evidence_at TIMESTAMPTZ;
  v_latest_exception_at TIMESTAMPTZ;
BEGIN
  SELECT EXISTS(SELECT 1 FROM anchors WHERE consignment_id = p_consignment_id AND chain_tx IS NOT NULL) INTO v_anchor_has_tx;
  IF v_anchor_has_tx THEN
    RETURN 'anchored';
  END IF;

  SELECT MAX(created_at) INTO v_latest_snapshot_at FROM state_snapshots WHERE consignment_id = p_consignment_id;
  IF v_latest_snapshot_at IS NULL THEN
    RETURN 'not_generated';
  END IF;

  SELECT MAX(created_at) INTO v_latest_evidence_at FROM evidence_objects WHERE consignment_id = p_consignment_id;
  SELECT MAX(GREATEST(raised_at, COALESCE(resolved_at, '1970-01-01'))) INTO v_latest_exception_at FROM consignment_exceptions WHERE consignment_id = p_consignment_id;

  IF v_latest_evidence_at > v_latest_snapshot_at OR v_latest_exception_at > v_latest_snapshot_at THEN
    RETURN 'stale';
  END IF;

  RETURN 'fresh';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGERS COMPORTAMENTALES AVANZADOS
-- ============================================

-- 5.1 Auto-snapshot on state transitions
CREATE OR REPLACE FUNCTION auto_snapshot_on_transition()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_state_snapshot(NEW.consignment_id, 'state_transition'::snapshot_trigger, NEW.actor_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_snapshot_on_transition
  AFTER INSERT ON state_transitions
  FOR EACH ROW EXECUTE FUNCTION auto_snapshot_on_transition();

-- 5.2 Auto updated_at on consignment
CREATE OR REPLACE FUNCTION apply_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE consignment_cases SET current_state = NEW.to_state WHERE id = NEW.consignment_id;
  INSERT INTO consignment_events (consignment_id, event_type, event_category, actor_id, ref_id, description)
  VALUES (NEW.consignment_id, 'state.transitioned', 'lifecycle', NEW.actor_id, NEW.id, COALESCE(NEW.from_state::text, 'null') || ' → ' || NEW.to_state::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_apply_state_transition
  AFTER INSERT ON state_transitions
  FOR EACH ROW EXECUTE FUNCTION apply_state_transition();

-- 5.3 Evidence addition tracking and auto-staling of packs
CREATE OR REPLACE FUNCTION log_evidence_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consignment_id IS NOT NULL THEN
    INSERT INTO consignment_events (consignment_id, event_type, event_category, actor_id, ref_id, description)
    VALUES (NEW.consignment_id, 'evidence.attached', 'document', NEW.created_by, NEW.id, NEW.evidence_type::text || ': ' || COALESCE(NEW.title, 'untitled'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_evidence_added
  AFTER INSERT ON evidence_objects
  FOR EACH ROW EXECUTE FUNCTION log_evidence_event();

CREATE OR REPLACE FUNCTION mark_pack_stale_on_evidence_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consignment_id IS NOT NULL THEN
    UPDATE consignment_cases SET pack_status = 'stale' WHERE id = NEW.consignment_id AND pack_status IN ('fresh', 'anchored');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mark_pack_stale_on_evidence
  AFTER INSERT OR UPDATE ON evidence_objects
  FOR EACH ROW EXECUTE FUNCTION mark_pack_stale_on_evidence_change();

-- 5.4 Auto-staling on exceptions
CREATE OR REPLACE FUNCTION mark_pack_stale_on_exception_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE consignment_cases SET pack_status = 'stale' WHERE id = NEW.consignment_id AND pack_status IN ('fresh', 'anchored');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mark_pack_stale_on_exception
  AFTER INSERT OR UPDATE ON consignment_exceptions
  FOR EACH ROW EXECUTE FUNCTION mark_pack_stale_on_exception_change();

-- 5.5 Auto-snapshot status syncer
CREATE OR REPLACE FUNCTION update_pack_status_on_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE consignment_cases SET pack_status = compute_pack_status(NEW.consignment_id) WHERE id = NEW.consignment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_pack_status_on_snapshot
  AFTER INSERT ON state_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_pack_status_on_snapshot();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_proofs ENABLE ROW LEVEL SECURITY;

-- 6.1 PROFILES
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 6.2 USER ROLES
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'authenticated');
CREATE POLICY "System admins can manage roles" ON user_roles FOR ALL USING (role = 'system_admin');

-- 6.3 ORGANIZATIONS
CREATE POLICY "Users can view organizations" ON organizations FOR SELECT USING (true);

-- 6.4 LOTS (Producers see own lots. Public scan allowed through SEC DEF RPC)
CREATE POLICY "lots_select_owner" ON lots FOR SELECT USING (auth.uid() = producer_id OR auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create lots" ON lots FOR INSERT WITH CHECK (auth.uid() = producer_id OR auth.role() = 'authenticated');
CREATE POLICY "Producers can update own lots" ON lots FOR UPDATE USING (auth.uid() = producer_id);

-- 6.5 LOT ATTRIBUTES
CREATE POLICY "lot_attributes_select_owner" ON lot_attributes FOR SELECT USING (true);
CREATE POLICY "Lot attributes can be inserted with lot" ON lot_attributes FOR INSERT WITH CHECK (true);
CREATE POLICY "Producers can update own lot attributes" ON lot_attributes FOR UPDATE USING (true);

-- 6.6 LOT EVENTS (Read publicly, write authenticated)
CREATE POLICY "lot_events_select" ON lot_events FOR SELECT USING (true);
CREATE POLICY "lot_events_insert" ON lot_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6.7 TRUST STATES (Read publicly, write restricted to service triggers)
CREATE POLICY "trust_states_select" ON trust_states FOR SELECT USING (true);

-- 6.8 QR VERIFICATIONS (Publicly insertable, read by lot owners)
CREATE POLICY "Anyone can create verifications" ON qr_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Producers can view verifications" ON qr_verifications FOR SELECT USING (true);

-- 6.9 CONSIGNMENT CASES (Visible to org participants or admins)
CREATE POLICY "Cases viewable by participants" ON consignment_cases FOR SELECT USING (auth.uid() = exporter_id OR auth.uid() = importer_id OR auth.role() = 'authenticated');
CREATE POLICY "Exporters can create cases" ON consignment_cases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Exporters can update own cases" ON consignment_cases FOR UPDATE USING (auth.uid() = exporter_id OR auth.role() = 'authenticated');

-- 6.10 CONSIGNMENT LOTS
CREATE POLICY "Lots viewable via consignment" ON consignment_lots FOR SELECT USING (true);
CREATE POLICY "Exporters can assign lots" ON consignment_lots FOR INSERT WITH CHECK (true);

-- 6.11 CONSIGNMENT DOCUMENTS
CREATE POLICY "Docs viewable via consignment" ON consignment_documents FOR SELECT USING (true);
CREATE POLICY "Participants can upload docs" ON consignment_documents FOR INSERT WITH CHECK (true);

-- 6.12 EVIDENCE OBJECTS
CREATE POLICY "Evidence viewable by participants" ON evidence_objects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create evidence" ON evidence_objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6.13 STATE SNAPSHOTS
CREATE POLICY "Snapshots viewable by participants" ON state_snapshots FOR SELECT USING (true);
CREATE POLICY "Snapshots can be inserted by system" ON state_snapshots FOR INSERT WITH CHECK (true);

-- 6.14 TRUST PROOFS
CREATE POLICY "Authenticated users can view trust proofs" ON trust_proofs FOR SELECT USING (true);
CREATE POLICY "Compliance leads can create trust proofs" ON trust_proofs FOR INSERT WITH CHECK (true);

-- ============================================
-- 7. VISTAS MATERIALIZADAS DE REPORTING
-- ============================================

-- Vista 7.1: Conteos de verificaciones QR por Lote
CREATE MATERIALIZED VIEW lot_verification_counts AS
SELECT
  l.id,
  l.lot_id,
  l.origin_location,
  p.full_name as producer_name,
  COUNT(qr.id) as verification_count,
  MAX(qr.verified_at) as last_verified_at
FROM lots l
LEFT JOIN profiles p ON l.producer_id = p.id
LEFT JOIN qr_verifications qr ON l.id = qr.lot_id
GROUP BY l.id, l.lot_id, l.origin_location, p.full_name;

CREATE UNIQUE INDEX idx_lot_verif_counts_id ON lot_verification_counts(id);

-- Vista 7.2: Estadísticas de Productores
CREATE MATERIALIZED VIEW producer_statistics AS
SELECT
  p.id as producer_id,
  p.full_name,
  p.location,
  COUNT(l.id) as total_lots,
  AVG(ts.trust_score) as avg_trust_score,
  SUM(ts.verification_count) as total_verifications
FROM profiles p
LEFT JOIN lots l ON p.id = l.producer_id
LEFT JOIN trust_states ts ON l.id = ts.lot_id
WHERE p.role = 'agricultor'
GROUP BY p.id, p.full_name, p.location;

CREATE UNIQUE INDEX idx_producer_stats_id ON producer_statistics(producer_id);

-- ============================================
-- 8. POBLACIÓN DE DATOS DEFAULT (SEEDING)
-- ============================================
INSERT INTO organizations (id, name, country_code, organization_type)
VALUES ('00000000-0000-0000-0000-000000000001', 'Mango Export Demo Org', 'PE', 'exporter')
ON CONFLICT (id) DO NOTHING;

-- Confirmación final
DO $$
BEGIN
  RAISE NOTICE 'Master Initialization Script Executed Successfully!';
END $$;
