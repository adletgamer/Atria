-- ============================================
-- MIGRATION: Real Chain-of-Custody + Actors + State Snapshots
-- ============================================
-- Fecha: 2026-03-27
-- Objetivo:
--   1. actors + actor_roles: identidad formal de actores en la cadena
--   2. custody_signing_level: un transfer no existe solo porque alguien lo escribió
--   3. state_snapshots: point-in-time snapshots para evidence packs
--   4. Refinar consignment_handoffs con signing levels y geolocation
--   5. Métricas duras: campos para time-to-pack, time-to-verify, uncertainty reduction

-- ============================================
-- 1. NUEVOS ENUMS
-- ============================================

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

-- ============================================
-- 2. TABLA: actors
-- ============================================

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
CREATE INDEX idx_actors_org ON actors(organization);
CREATE INDEX idx_actors_verified ON actors(is_verified);

COMMENT ON TABLE actors IS 'Identidad formal de actores en la cadena. Un actor puede o no tener un profile_id (actores externos).';

-- ============================================
-- 3. TABLA: actor_roles
-- ============================================

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
CREATE INDEX idx_ar_active ON actor_roles(is_active);
CREATE UNIQUE INDEX idx_ar_unique_active ON actor_roles(actor_id, consignment_id, role_name)
  WHERE is_active = true;

COMMENT ON TABLE actor_roles IS 'Roles asignados a actores por consignación. Un actor puede tener múltiples roles.';

-- ============================================
-- 4. TABLA: state_snapshots
-- ============================================

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
  evidence_completeness_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  custody_gap_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_consignment ON state_snapshots(consignment_id);
CREATE INDEX idx_ss_trigger ON state_snapshots(trigger_type);
CREATE INDEX idx_ss_hash ON state_snapshots(snapshot_hash);
CREATE INDEX idx_ss_created ON state_snapshots(created_at DESC);

COMMENT ON TABLE state_snapshots IS 'Point-in-time snapshots del estado de una consignación. Inmutable. Base para evidence packs y anchoring.';

-- ============================================
-- 5. REFINAR: consignment_handoffs → real custody
-- ============================================

-- Signing level: un transfer no existe solo porque alguien lo escribió
ALTER TABLE consignment_handoffs
  ADD COLUMN signing_level custody_signing_level NOT NULL DEFAULT 'unsigned';

-- Sender signature
ALTER TABLE consignment_handoffs
  ADD COLUMN sender_signed_at TIMESTAMPTZ,
  ADD COLUMN sender_sig_method VARCHAR(50);

-- Receiver signature (receiver_ack already exists, add sig method)
ALTER TABLE consignment_handoffs
  ADD COLUMN receiver_sig_method VARCHAR(50);

-- Third party witness
ALTER TABLE consignment_handoffs
  ADD COLUMN witness_id UUID REFERENCES actors(id),
  ADD COLUMN witness_signed_at TIMESTAMPTZ,
  ADD COLUMN witness_sig_method VARCHAR(50);

-- Geolocation
ALTER TABLE consignment_handoffs
  ADD COLUMN geo_lat NUMERIC(10,7),
  ADD COLUMN geo_lng NUMERIC(10,7),
  ADD COLUMN geo_accuracy_m NUMERIC(8,2);

-- Actor references (formal actor identity, not just profile_id)
ALTER TABLE consignment_handoffs
  ADD COLUMN from_actor_id UUID REFERENCES actors(id),
  ADD COLUMN to_actor_id UUID REFERENCES actors(id);

CREATE INDEX idx_ch_signing ON consignment_handoffs(signing_level);
CREATE INDEX idx_ch_from_actor ON consignment_handoffs(from_actor_id);
CREATE INDEX idx_ch_to_actor ON consignment_handoffs(to_actor_id);

COMMENT ON COLUMN consignment_handoffs.signing_level IS 'Nivel de firma: unsigned < sender_signed < receiver_acknowledged < dual_signed < third_party_witnessed';

-- ============================================
-- 6. MÉTRICAS: campos en consignment_cases
-- ============================================

ALTER TABLE consignment_cases
  ADD COLUMN pack_requested_at TIMESTAMPTZ,
  ADD COLUMN pack_generated_at TIMESTAMPTZ,
  ADD COLUMN verification_requested_at TIMESTAMPTZ,
  ADD COLUMN verification_completed_at TIMESTAMPTZ,
  ADD COLUMN evidence_completeness_pct NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN custody_gap_count INTEGER DEFAULT 0,
  ADD COLUMN blocking_exception_count INTEGER DEFAULT 0;

COMMENT ON COLUMN consignment_cases.pack_requested_at IS 'Métrica 1: inicio del timer time-to-evidence-pack';
COMMENT ON COLUMN consignment_cases.pack_generated_at IS 'Métrica 1: fin del timer time-to-evidence-pack';
COMMENT ON COLUMN consignment_cases.verification_requested_at IS 'Métrica 2: inicio del timer time-to-verification';
COMMENT ON COLUMN consignment_cases.verification_completed_at IS 'Métrica 2: fin del timer time-to-verification';
COMMENT ON COLUMN consignment_cases.evidence_completeness_pct IS 'Métrica 3 sub: porcentaje de evidencia crítica presente';
COMMENT ON COLUMN consignment_cases.custody_gap_count IS 'Métrica 3 sub: gaps en cadena de custodia';
COMMENT ON COLUMN consignment_cases.blocking_exception_count IS 'Métrica 3 sub: excepciones bloqueantes abiertas';

-- ============================================
-- 7. FUNCIÓN: compute_custody_continuity
-- ============================================

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
  SELECT COUNT(*) INTO v_total
  FROM consignment_handoffs
  WHERE consignment_id = p_consignment_id;

  SELECT COUNT(*) INTO v_signed
  FROM consignment_handoffs
  WHERE consignment_id = p_consignment_id
    AND signing_level != 'unsigned';

  SELECT COUNT(*) INTO v_dual
  FROM consignment_handoffs
  WHERE consignment_id = p_consignment_id
    AND signing_level = 'dual_signed';

  SELECT COUNT(*) INTO v_witnessed
  FROM consignment_handoffs
  WHERE consignment_id = p_consignment_id
    AND signing_level = 'third_party_witnessed';

  v_unsigned := v_total - v_signed;

  -- Custody gaps = unsigned transfers + handoffs without receiver_ack
  SELECT COUNT(*) INTO v_gaps
  FROM consignment_handoffs
  WHERE consignment_id = p_consignment_id
    AND (signing_level = 'unsigned' OR receiver_ack = false);

  -- Score: 0-100. Higher = better continuity.
  IF v_total = 0 THEN
    v_score := 0;
  ELSE
    v_score := ROUND(
      (v_signed::NUMERIC / v_total * 60) +
      ((v_dual + v_witnessed)::NUMERIC / GREATEST(v_total, 1) * 40),
      2
    );
  END IF;

  -- Update consignment_cases with gap count
  UPDATE consignment_cases
  SET custody_gap_count = v_gaps
  WHERE id = p_consignment_id;

  RETURN QUERY SELECT v_total, v_signed, v_dual, v_witnessed, v_unsigned, v_gaps, v_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. FUNCIÓN: compute_evidence_completeness
-- ============================================

CREATE OR REPLACE FUNCTION compute_evidence_completeness(p_consignment_id UUID)
RETURNS TABLE (
  total_required INTEGER,
  total_present INTEGER,
  total_verified INTEGER,
  completeness_pct NUMERIC(5,2),
  missing_critical TEXT[]
) AS $$
DECLARE
  v_required INTEGER := 0;
  v_present INTEGER := 0;
  v_verified INTEGER := 0;
  v_missing TEXT[] := '{}';
  v_pct NUMERIC(5,2);
BEGIN
  -- Critical document types (required for export)
  -- Check each one
  v_required := 6; -- phyto, origin, packing, invoice, BoL, customs

  IF EXISTS (SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'phytosanitary_cert') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'phytosanitary_cert');
  END IF;

  IF EXISTS (SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'certificate_of_origin') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'certificate_of_origin');
  END IF;

  IF EXISTS (SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'packing_list') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'packing_list');
  END IF;

  IF EXISTS (SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'commercial_invoice') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'commercial_invoice');
  END IF;

  IF EXISTS (SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'bill_of_lading') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'bill_of_lading');
  END IF;

  IF EXISTS (SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'customs_declaration') THEN
    v_present := v_present + 1;
  ELSE
    v_missing := array_append(v_missing, 'customs_declaration');
  END IF;

  -- Verified count
  SELECT COUNT(*) INTO v_verified
  FROM consignment_documents
  WHERE consignment_id = p_consignment_id
    AND verified = true;

  v_pct := ROUND((v_present::NUMERIC / GREATEST(v_required, 1)) * 100, 2);

  -- Update consignment_cases
  UPDATE consignment_cases
  SET evidence_completeness_pct = v_pct
  WHERE id = p_consignment_id;

  RETURN QUERY SELECT v_required, v_present, v_verified, v_pct, v_missing;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. FUNCIÓN: create_state_snapshot
-- ============================================

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
  v_completeness NUMERIC(5,2);
  v_gaps INTEGER;
  v_snapshot JSONB;
  v_hash TEXT;
BEGIN
  -- Get case
  SELECT * INTO v_case
  FROM consignment_cases
  WHERE id = p_consignment_id;

  IF v_case IS NULL THEN
    RAISE EXCEPTION 'Consignment not found: %', p_consignment_id;
  END IF;

  -- Counts
  SELECT COUNT(*) INTO v_evidence_count
  FROM evidence_objects WHERE consignment_id = p_consignment_id;

  SELECT COUNT(*) INTO v_att_count
  FROM consignment_attestations WHERE consignment_id = p_consignment_id AND revoked = false;

  SELECT COUNT(*) INTO v_handoff_count
  FROM consignment_handoffs WHERE consignment_id = p_consignment_id;

  SELECT COUNT(*) INTO v_open_exc
  FROM consignment_exceptions WHERE consignment_id = p_consignment_id AND resolved = false;

  SELECT COUNT(*) INTO v_blocking_exc
  FROM consignment_exceptions WHERE consignment_id = p_consignment_id AND resolved = false AND blocks_readiness = true;

  v_completeness := COALESCE(v_case.evidence_completeness_pct, 0);
  v_gaps := COALESCE(v_case.custody_gap_count, 0);

  -- Build snapshot
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
    'evidence_completeness_pct', v_completeness,
    'custody_gap_count', v_gaps,
    'snapshot_time', NOW()
  );

  -- Hash = MD5 of snapshot JSON (good enough for snapshot dedup; real hash computed off-chain)
  v_hash := md5(v_snapshot::text);

  INSERT INTO state_snapshots (
    consignment_id, trigger_type, triggered_by,
    snapshot_hash, snapshot_data, current_state,
    evidence_count, attestation_count, handoff_count,
    open_exceptions, blocking_exceptions,
    evidence_completeness_pct, custody_gap_count
  ) VALUES (
    p_consignment_id, p_trigger, p_triggered_by,
    v_hash, v_snapshot, v_case.current_state::text,
    v_evidence_count, v_att_count, v_handoff_count,
    v_open_exc, v_blocking_exc,
    v_completeness, v_gaps
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. TRIGGER: auto-snapshot on state transitions
-- ============================================

CREATE OR REPLACE FUNCTION auto_snapshot_on_transition()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_state_snapshot(
    NEW.consignment_id,
    'state_transition'::snapshot_trigger,
    NEW.actor_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_snapshot_on_transition
  AFTER INSERT ON state_transitions
  FOR EACH ROW
  EXECUTE FUNCTION auto_snapshot_on_transition();

-- ============================================
-- 11. TRIGGER: update signing_level automatically
-- ============================================

CREATE OR REPLACE FUNCTION update_signing_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine signing level based on available signatures
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
  FOR EACH ROW
  EXECUTE FUNCTION update_signing_level();

-- ============================================
-- 12. RLS
-- ============================================

ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_snapshots ENABLE ROW LEVEL SECURITY;

-- actors: readable by authenticated users
CREATE POLICY "Actors readable by authenticated"
  ON actors FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Actors creatable by authenticated"
  ON actors FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Actors updatable by owner"
  ON actors FOR UPDATE
  USING (profile_id = auth.uid());

-- actor_roles: visible by consignment participants
CREATE POLICY "Roles viewable by participants"
  ON actor_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = actor_roles.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "Roles assignable by participants"
  ON actor_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = actor_roles.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

-- state_snapshots: viewable by participants
CREATE POLICY "Snapshots viewable by participants"
  ON state_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = state_snapshots.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

-- snapshots insertable (by system/participants)
CREATE POLICY "Snapshots creatable"
  ON state_snapshots FOR INSERT
  WITH CHECK (true);

-- NO UPDATE, NO DELETE on state_snapshots (immutable)

-- ============================================
-- FIN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Real Chain-of-Custody migration complete';
  RAISE NOTICE 'New tables: actors, actor_roles, state_snapshots';
  RAISE NOTICE 'Refined: consignment_handoffs (signing_level, geo, actor refs, witness)';
  RAISE NOTICE 'Refined: consignment_cases (metric timestamps, completeness, gaps)';
  RAISE NOTICE 'New functions: compute_custody_continuity, compute_evidence_completeness, create_state_snapshot';
  RAISE NOTICE 'New triggers: auto-snapshot on state transition, auto-signing-level on handoff';
  RAISE NOTICE 'Signing levels enforced: unsigned < sender_signed < receiver_acknowledged < dual_signed < third_party_witnessed';
END $$;
