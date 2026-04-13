-- ============================================
-- SEED DATA — Stage 2 Consignment Cases
-- ============================================
-- Run after all migrations. Requires at least one user in profiles table.
-- Creates 2 consignment cases with full vertical slice data:
--   Case 1: CS-2026-001 — near-ready (most evidence, some exceptions)
--   Case 2: CS-2026-002 — blocked (missing evidence, custody gaps, exceptions)
-- ============================================

BEGIN;

DO $$
DECLARE
  v_exporter_id UUID;
  v_case1_id UUID;
  v_case2_id UUID;
  v_lot1_id UUID;
  v_lot2_id UUID;
  v_lot3_id UUID;
  v_eo1 UUID;
  v_eo2 UUID;
  v_eo3 UUID;
  v_eo4 UUID;
  v_eo5 UUID;
  v_actor1_id UUID;
  v_actor2_id UUID;
BEGIN
  -- ==========================================
  -- 0. Get exporter (first profile found)
  -- ==========================================
  SELECT id INTO v_exporter_id
  FROM profiles
  LIMIT 1;

  IF v_exporter_id IS NULL THEN
    RAISE EXCEPTION 'No profile found. Create a user first.';
  END IF;

  RAISE NOTICE 'Using exporter: %', v_exporter_id;

  -- ==========================================
  -- 1. CASE 1: CS-2026-001 — Near Ready
  -- ==========================================
  INSERT INTO consignment_cases (
    case_number, exporter_id, destination_country, destination_port,
    incoterm, status, total_pallets, total_kg, estimated_departure
  ) VALUES (
    'CS-2026-001', v_exporter_id, 'United States', 'Los Angeles',
    'FOB', 'pending_inspection', 12, 28500.00, '2026-04-15'
  )
  RETURNING id INTO v_case1_id;

  RAISE NOTICE 'Case 1 created: %', v_case1_id;

  -- Attach lots (get existing lots or create minimal ones)
  SELECT id INTO v_lot1_id FROM lots WHERE lot_id = 'MG-2026-001' LIMIT 1;
  SELECT id INTO v_lot2_id FROM lots WHERE lot_id = 'MG-2026-002' LIMIT 1;

  IF v_lot1_id IS NOT NULL THEN
    INSERT INTO consignment_lots (consignment_id, lot_id, sequence_number, notes)
    VALUES (v_case1_id, v_lot1_id, 1, 'Primary lot - Kent Premium');
  END IF;

  IF v_lot2_id IS NOT NULL THEN
    INSERT INTO consignment_lots (consignment_id, lot_id, sequence_number, notes)
    VALUES (v_case1_id, v_lot2_id, 2, 'Secondary lot - Tommy Atkins');
  END IF;

  -- Evidence objects (5 of 6 required types)
  INSERT INTO evidence_objects (
    consignment_id, evidence_type, source_system, content_hash,
    created_by, title, description
  ) VALUES
  (v_case1_id, 'certificate', 'platform', md5('phyto-cert-001'),
   v_exporter_id, 'Phytosanitary Certificate', 'SENASA phytosanitary certificate for mango export')
  RETURNING id INTO v_eo1;

  INSERT INTO evidence_objects (
    consignment_id, evidence_type, source_system, content_hash,
    created_by, title, description
  ) VALUES
  (v_case1_id, 'document', 'platform', md5('origin-cert-001'),
   v_exporter_id, 'Certificate of Origin', 'Chamber of Commerce certificate of origin')
  RETURNING id INTO v_eo2;

  INSERT INTO evidence_objects (
    consignment_id, evidence_type, source_system, content_hash,
    created_by, title, description
  ) VALUES
  (v_case1_id, 'inspection_report', 'platform', md5('inspection-001'),
   v_exporter_id, 'Quality Inspection Report', 'Pre-shipment quality inspection by SGS')
  RETURNING id INTO v_eo3;

  INSERT INTO evidence_objects (
    consignment_id, evidence_type, source_system, content_hash,
    created_by, title, description
  ) VALUES
  (v_case1_id, 'declaration', 'platform', md5('customs-decl-001'),
   v_exporter_id, 'Customs Export Declaration', 'SUNAT customs export declaration')
  RETURNING id INTO v_eo4;

  INSERT INTO evidence_objects (
    consignment_id, evidence_type, source_system, content_hash,
    created_by, title, description
  ) VALUES
  (v_case1_id, 'transport_log', 'platform', md5('transport-001'),
   v_exporter_id, 'Refrigerated Transport Log', 'Temperature-controlled transport from Piura to Callao')
  RETURNING id INTO v_eo5;

  INSERT INTO evidence_objects (
    consignment_id, evidence_type, source_system, content_hash,
    created_by, title, description
  ) VALUES
  (v_case1_id, 'treatment_record', 'platform', md5('treatment-001'),
   v_exporter_id, 'Hydrothermal Treatment Record', 'SENASA certified hot water treatment at 46°C for 75 mins')
  RETURNING id INTO v_eo5;
  -- All 6 critical documents attached for Case 1

  -- Actors
  INSERT INTO actors (profile_id, display_name, actor_type, organization, country, is_verified)
  VALUES (v_exporter_id, 'Mango Export Peru SAC', 'exporter', 'Mango Export Peru', 'PE', true)
  RETURNING id INTO v_actor1_id;

  INSERT INTO actors (display_name, actor_type, organization, country, is_verified)
  VALUES ('SGS Inspection Services', 'inspector', 'SGS', 'PE', true)
  RETURNING id INTO v_actor2_id;

  -- Actor roles
  INSERT INTO actor_roles (actor_id, consignment_id, role_name, granted_by)
  VALUES
    (v_actor1_id, v_case1_id, 'exporter', v_exporter_id),
    (v_actor2_id, v_case1_id, 'inspector', v_exporter_id);

  -- Attestations (4 of 6 required)
  INSERT INTO consignment_attestations (
    consignment_id, att_type, attested_by, role_at_time,
    statement, evidence_refs, sig_method
  ) VALUES
  (v_case1_id, 'quality_confirmed', v_exporter_id, 'inspector',
   'Quality inspection passed. Grade: Export Premium.', ARRAY[v_eo3], 'platform_auth'),
  (v_case1_id, 'docs_complete', v_exporter_id, 'exporter',
   'All available export documents uploaded and verified.', ARRAY[v_eo1, v_eo2, v_eo4], 'platform_auth'),
  (v_case1_id, 'phyto_cleared', v_exporter_id, 'exporter',
   'Phytosanitary certificate issued by SENASA.', ARRAY[v_eo1], 'platform_auth'),
  (v_case1_id, 'inspection_passed', v_exporter_id, 'inspector',
   'Pre-shipment inspection passed by SGS.', ARRAY[v_eo3], 'platform_auth');

  -- Handoffs (3 handoffs, 2 signed, 1 unsigned = 1 gap)
  INSERT INTO consignment_handoffs (
    consignment_id, from_party_id, to_party_id, ho_type,
    location, condition_notes, temperature_c, sender_signed_at
  ) VALUES
  (v_case1_id, v_exporter_id, v_exporter_id, 'producer_to_packer',
   'Piura - Finca El Sol', 'Fruit in good condition', 12.5, NOW() - interval '10 days');

  INSERT INTO consignment_handoffs (
    consignment_id, from_party_id, to_party_id, ho_type,
    location, condition_notes, temperature_c,
    sender_signed_at, receiver_ack, receiver_ack_at, receiver_ack_by
  ) VALUES
  (v_case1_id, v_exporter_id, v_exporter_id, 'packer_to_cold_storage',
   'Piura - Planta Empaque', 'Packed in 4kg boxes, palletized', 8.2,
   NOW() - interval '8 days', true, NOW() - interval '8 days', v_exporter_id);

  INSERT INTO consignment_handoffs (
    consignment_id, from_party_id, to_party_id, ho_type,
    location, condition_notes, temperature_c,
    sender_signed_at, receiver_ack, receiver_ack_at, receiver_ack_by
  ) VALUES
  (v_case1_id, v_exporter_id, v_exporter_id, 'cold_storage_to_transport',
   'Piura - Frigorífico Norte', 'Loaded into reefer container', 7.0,
   NOW() - interval '2 days', true, NOW() - interval '2 days', v_exporter_id);
  -- Fully signed = no gap

  -- One manual exception (temperature warning)
  INSERT INTO consignment_exceptions (
    consignment_id, exc_type, severity, title, description,
    raised_by, blocks_readiness
  ) VALUES
  (v_case1_id, 'temperature_breach', 'warning',
   'Temperature spike during packing',
   'Temperature reached 14.2°C for 45 minutes during packing operations. Within tolerance.',
   v_exporter_id, false);

  -- ==========================================
  -- 2. CASE 2: CS-2026-002 — Blocked
  -- ==========================================
  INSERT INTO consignment_cases (
    case_number, exporter_id, destination_country, destination_port,
    incoterm, status, total_pallets, total_kg, estimated_departure
  ) VALUES (
    'CS-2026-002', v_exporter_id, 'Netherlands', 'Rotterdam',
    'CIF', 'draft', 8, 19200.00, '2026-04-22'
  )
  RETURNING id INTO v_case2_id;

  RAISE NOTICE 'Case 2 created: %', v_case2_id;

  -- Attach one lot
  SELECT id INTO v_lot3_id FROM lots WHERE lot_id = 'MG-2026-004' LIMIT 1;
  IF v_lot3_id IS NOT NULL THEN
    INSERT INTO consignment_lots (consignment_id, lot_id, sequence_number, notes)
    VALUES (v_case2_id, v_lot3_id, 1, 'Single lot - Kent Export');
  END IF;

  -- Only 2 evidence objects (4 missing = will generate 4 blocking exceptions)
  INSERT INTO evidence_objects (
    consignment_id, evidence_type, source_system, content_hash,
    created_by, title, description
  ) VALUES
  (v_case2_id, 'certificate', 'platform', md5('phyto-cert-002'),
   v_exporter_id, 'Phytosanitary Certificate', 'SENASA phyto cert for EU export');

  INSERT INTO evidence_objects (
    consignment_id, evidence_type, source_system, content_hash,
    created_by, title, description
  ) VALUES
  (v_case2_id, 'document', 'platform', md5('origin-cert-002'),
   v_exporter_id, 'Certificate of Origin', 'Chamber of Commerce origin cert');

  -- Missing: inspection_report, declaration, transport_log, treatment_record

  -- One expired document (in consignment_documents for backward compat test)
  INSERT INTO consignment_documents (
    consignment_id, doc_type, title, issued_by, issued_at, expires_at
  ) VALUES
  (v_case2_id, 'fumigation_cert', 'Fumigation Certificate',
   'FumiPeru SAC', NOW() - interval '90 days', NOW() - interval '30 days');

  -- One unsigned handoff (custody gap)
  INSERT INTO consignment_handoffs (
    consignment_id, from_party_id, to_party_id, ho_type,
    location, condition_notes
  ) VALUES
  (v_case2_id, v_exporter_id, v_exporter_id, 'producer_to_packer',
   'La Libertad - Finca Norte', 'Fruit received, pending inspection');
  -- Unsigned = gap

  -- Actor roles for case 2
  INSERT INTO actor_roles (actor_id, consignment_id, role_name, granted_by)
  VALUES (v_actor1_id, v_case2_id, 'exporter', v_exporter_id);

  -- No attestations for case 2 (will generate 6 warning exceptions)

  -- ==========================================
  -- 3. Run exception evaluation on both cases
  -- ==========================================
  PERFORM evaluate_consignment_exceptions(v_case1_id, v_exporter_id);
  PERFORM evaluate_consignment_exceptions(v_case2_id, v_exporter_id);

  -- ==========================================
  -- 4. Create state snapshots for both cases
  -- ==========================================
  PERFORM create_state_snapshot(v_case1_id, 'manual'::snapshot_trigger, v_exporter_id);
  PERFORM create_state_snapshot(v_case2_id, 'manual'::snapshot_trigger, v_exporter_id);

  RAISE NOTICE 'Seed complete. Case 1: % (near-ready), Case 2: % (blocked)', v_case1_id, v_case2_id;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- SELECT case_number, status, current_state, evidence_completeness_pct, blocking_exception_count, custody_gap_count FROM consignment_cases ORDER BY case_number;
-- SELECT ce.title, ce.exc_type, ce.severity, ce.blocks_readiness, ce.resolved FROM consignment_exceptions ce JOIN consignment_cases cc ON cc.id = ce.consignment_id ORDER BY cc.case_number, ce.blocks_readiness DESC;
-- SELECT ss.consignment_id, ss.evidence_completeness_pct, ss.attribution_strength, ss.custody_continuity_score, ss.decision_readiness_import, ss.decision_readiness_financing, ss.blocking_exceptions, ss.warning_exceptions FROM state_snapshots ss ORDER BY ss.created_at DESC LIMIT 2;
