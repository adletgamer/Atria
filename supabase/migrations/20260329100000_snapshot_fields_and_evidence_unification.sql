-- ============================================
-- MIGRATION: Snapshot Decision Fields + Evidence Model Unification
-- ============================================
-- Date: 2026-03-29
-- Purpose:
--   1. Add decision-readiness fields to state_snapshots
--   2. Update compute_evidence_completeness to use evidence_objects (canonical model)
--   3. Update create_state_snapshot to compute new fields
--   4. Add evaluate_consignment_exceptions RPC (4 rules)

-- ============================================
-- 1. ADD FIELDS TO state_snapshots
-- ============================================

ALTER TABLE state_snapshots
  ADD COLUMN IF NOT EXISTS attribution_strength NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custody_continuity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS decision_readiness_import BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS decision_readiness_financing BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS warning_exceptions INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN state_snapshots.attribution_strength IS 'Percentage of required attestation types present (0-100)';
COMMENT ON COLUMN state_snapshots.custody_continuity_score IS 'Custody chain score from compute_custody_continuity (0-100)';
COMMENT ON COLUMN state_snapshots.decision_readiness_import IS 'completeness>=80 AND custody_gaps=0 AND blocking=0';
COMMENT ON COLUMN state_snapshots.decision_readiness_financing IS 'completeness>=70 AND continuity>=70 AND blocking=0';

-- ============================================
-- 2. REPLACE compute_evidence_completeness
--    Now uses evidence_objects (canonical) instead of consignment_documents
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
  v_required INTEGER := 6;
  v_present INTEGER := 0;
  v_verified INTEGER := 0;
  v_missing TEXT[] := '{}';
  v_pct NUMERIC(5,2);
BEGIN
  -- Required evidence types for export readiness
  -- Maps to evidence_type enum values that serve as critical documents

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

  -- Also count consignment_documents as evidence (backward compat)
  IF v_present < v_required THEN
    IF EXISTS (SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'phytosanitary_cert')
       AND NOT EXISTS (SELECT 1 FROM evidence_objects WHERE consignment_id = p_consignment_id AND evidence_type = 'certificate') THEN
      v_present := v_present + 1;
      v_missing := array_remove(v_missing, 'certificate');
    END IF;
  END IF;

  -- Verified = evidence objects that have an attestation referencing them
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

-- ============================================
-- 3. REPLACE create_state_snapshot — compute new fields
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

  SELECT COUNT(*) INTO v_warning_exc
  FROM consignment_exceptions WHERE consignment_id = p_consignment_id AND resolved = false AND blocks_readiness = false;

  -- Compute evidence completeness via RPC
  SELECT * INTO v_completeness_result
  FROM compute_evidence_completeness(p_consignment_id);
  v_completeness := COALESCE(v_completeness_result.completeness_pct, 0);

  -- Compute custody continuity via RPC
  SELECT * INTO v_custody_result
  FROM compute_custody_continuity(p_consignment_id);
  v_custody_score := COALESCE(v_custody_result.continuity_score, 0);
  v_gaps := COALESCE(v_custody_result.custody_gaps, 0);

  -- Compute attribution strength
  SELECT COUNT(DISTINCT att_type) INTO v_present_att
  FROM consignment_attestations
  WHERE consignment_id = p_consignment_id AND revoked = false;

  v_att_strength := ROUND((v_present_att::NUMERIC / GREATEST(v_required_att, 1)) * 100, 2);

  -- Decision readiness
  v_import_ready := (v_completeness >= 80 AND v_gaps = 0 AND v_blocking_exc = 0);
  v_financing_ready := (v_completeness >= 70 AND v_custody_score >= 70 AND v_blocking_exc = 0);

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

  -- Update consignment_cases cached metrics
  UPDATE consignment_cases SET
    blocking_exception_count = v_blocking_exc,
    evidence_completeness_pct = v_completeness,
    custody_gap_count = v_gaps
  WHERE id = p_consignment_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. RPC: evaluate_consignment_exceptions
-- ============================================

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
  -- =====================
  -- RULE 1: Missing required evidence
  -- =====================
  SELECT ec.missing_critical INTO v_missing
  FROM compute_evidence_completeness(p_consignment_id) ec;

  IF v_missing IS NOT NULL THEN
    FOREACH v_item IN ARRAY v_missing
    LOOP
      -- Check if this exception already exists and is unresolved
      IF NOT EXISTS (
        SELECT 1 FROM consignment_exceptions
        WHERE consignment_id = p_consignment_id
          AND exc_type = 'doc_missing'
          AND resolved = false
          AND title LIKE '%' || v_item || '%'
      ) THEN
        INSERT INTO consignment_exceptions (
          consignment_id, exc_type, severity, title, description,
          raised_by, blocks_readiness
        ) VALUES (
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

  -- Auto-resolve doc_missing exceptions where evidence now exists
  UPDATE consignment_exceptions SET
    resolved = true,
    resolved_at = NOW(),
    resolved_by = p_actor_id,
    resolution = 'Evidence type now present'
  WHERE consignment_id = p_consignment_id
    AND exc_type = 'doc_missing'
    AND resolved = false
    AND NOT EXISTS (
      SELECT 1 FROM unnest(v_missing) m WHERE title LIKE '%' || m || '%'
    );

  -- =====================
  -- RULE 2: Expired documents
  -- =====================
  INSERT INTO consignment_exceptions (
    consignment_id, exc_type, severity, title, description,
    raised_by, blocks_readiness
  )
  SELECT
    p_consignment_id, 'doc_expired', 'blocking',
    'Expired document: ' || cd.title,
    'Document "' || cd.title || '" expired on ' || cd.expires_at::text,
    p_actor_id, true
  FROM consignment_documents cd
  WHERE cd.consignment_id = p_consignment_id
    AND cd.expires_at IS NOT NULL
    AND cd.expires_at < NOW()
    AND NOT EXISTS (
      SELECT 1 FROM consignment_exceptions ce
      WHERE ce.consignment_id = p_consignment_id
        AND ce.exc_type = 'doc_expired'
        AND ce.resolved = false
        AND ce.title LIKE '%' || cd.title || '%'
    )
  RETURNING id, exc_type, severity, title, true
  INTO v_exc_id;

  -- Return any expired doc exceptions
  RETURN QUERY
  SELECT ce.id, ce.exc_type, ce.severity, ce.title::TEXT, false
  FROM consignment_exceptions ce
  WHERE ce.consignment_id = p_consignment_id
    AND ce.exc_type = 'doc_expired'
    AND ce.resolved = false;

  -- =====================
  -- RULE 3: Missing required attestations
  -- =====================
  SELECT ARRAY_AGG(DISTINCT att_type::text) INTO v_present_att
  FROM consignment_attestations
  WHERE consignment_id = p_consignment_id AND revoked = false;

  v_present_att := COALESCE(v_present_att, '{}');

  FOREACH v_item IN ARRAY v_required_att
  LOOP
    IF NOT (v_item = ANY(v_present_att)) THEN
      IF NOT EXISTS (
        SELECT 1 FROM consignment_exceptions
        WHERE consignment_id = p_consignment_id
          AND exc_type = 'regulatory_block'
          AND resolved = false
          AND title LIKE '%attestation%' || v_item || '%'
      ) THEN
        INSERT INTO consignment_exceptions (
          consignment_id, exc_type, severity, title, description,
          raised_by, blocks_readiness
        ) VALUES (
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

  -- =====================
  -- RULE 4: Custody gaps
  -- =====================
  SELECT cc.custody_gaps INTO v_gaps
  FROM compute_custody_continuity(p_consignment_id) cc;

  IF v_gaps > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM consignment_exceptions
      WHERE consignment_id = p_consignment_id
        AND exc_type = 'customs_hold'
        AND resolved = false
        AND title LIKE '%custody gap%'
    ) THEN
      INSERT INTO consignment_exceptions (
        consignment_id, exc_type, severity, title, description,
        raised_by, blocks_readiness
      ) VALUES (
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
    -- Auto-resolve custody gap exceptions if gaps resolved
    UPDATE consignment_exceptions SET
      resolved = true,
      resolved_at = NOW(),
      resolved_by = p_actor_id,
      resolution = 'All handoffs now properly signed'
    WHERE consignment_id = p_consignment_id
      AND exc_type = 'customs_hold'
      AND resolved = false
      AND title LIKE '%custody gap%';
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION evaluate_consignment_exceptions IS 'Evaluates 4 exception rules: missing evidence, expired docs, missing attestations, custody gaps. Auto-creates and auto-resolves exceptions.';

-- ============================================
-- 5. RLS for new function usage
-- ============================================

-- evaluate_consignment_exceptions uses SECURITY INVOKER (default)
-- which means RLS on underlying tables still applies

-- ============================================
-- FIN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Snapshot fields + evidence unification migration complete';
  RAISE NOTICE 'New snapshot fields: attribution_strength, custody_continuity_score, decision_readiness_import, decision_readiness_financing, warning_exceptions';
  RAISE NOTICE 'compute_evidence_completeness now uses evidence_objects (canonical)';
  RAISE NOTICE 'create_state_snapshot now computes all decision fields';
  RAISE NOTICE 'New RPC: evaluate_consignment_exceptions (4 rules)';
END $$;
