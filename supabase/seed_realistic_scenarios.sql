-- ============================================================================
-- REALISTIC SEED DATA — 4 SCENARIOS
-- ============================================================================
-- Scenario 1: Import-Ready (CS-2026-003)
-- Scenario 2: Underwriting-Only (CS-2026-004)
-- Scenario 3: Doc-Blocked (CS-2026-005)
-- Scenario 4: Custody-Blocked (CS-2026-006)
-- ============================================================================

-- Clean existing test data (optional - comment out if you want to keep existing)
-- DELETE FROM consignment_cases WHERE case_number LIKE 'CS-2026-00%';

-- ============================================================================
-- SCENARIO 1: IMPORT-READY
-- All criteria met for customs clearance
-- ============================================================================

-- Consignment Case
INSERT INTO consignment_cases (
  id, case_number, origin_country, destination_country, 
  exporter_name, estimated_departure, estimated_arrival,
  current_state, pack_status, created_by
) VALUES (
  'cs-import-ready-001',
  'CS-2026-003',
  'PE',
  'US',
  'Agrícola Valle Verde S.A.C.',
  '2026-04-15',
  '2026-04-25',
  'ready',
  'fresh',
  'system'
);

-- Lots (3 lots)
INSERT INTO lots (id, lot_number, product_type, quantity_kg, origin_region, harvest_date, created_by)
VALUES 
  ('lot-ir-001', 'LOT-VV-2026-A01', 'Kent Mango', 5000, 'Piura', '2026-03-20', 'system'),
  ('lot-ir-002', 'LOT-VV-2026-A02', 'Kent Mango', 4800, 'Piura', '2026-03-21', 'system'),
  ('lot-ir-003', 'LOT-VV-2026-A03', 'Kent Mango', 5200, 'Piura', '2026-03-22', 'system');

-- Link lots to consignment
INSERT INTO consignment_lots (consignment_id, lot_id) VALUES
  ('cs-import-ready-001', 'lot-ir-001'),
  ('cs-import-ready-001', 'lot-ir-002'),
  ('cs-import-ready-001', 'lot-ir-003');

-- Evidence Objects (8 pieces - complete set)
INSERT INTO evidence_objects (
  id, consignment_id, evidence_type, title, description, 
  file_hash, file_size, storage_path, visibility, created_by
) VALUES
  ('ev-ir-001', 'cs-import-ready-001', 'certificate', 'Phytosanitary Certificate', 'SENASA export clearance', 'hash-phyto-ir', 245678, '/evidence/cs-003/phyto.pdf', 'shared', 'system'),
  ('ev-ir-002', 'cs-import-ready-001', 'certificate', 'Export Clearance Certificate', 'SUNAT export authorization', 'hash-export-ir', 189234, '/evidence/cs-003/export.pdf', 'shared', 'system'),
  ('ev-ir-003', 'cs-import-ready-001', 'certificate', 'Quality Certificate', 'SGS quality inspection', 'hash-quality-ir', 312456, '/evidence/cs-003/quality.pdf', 'shared', 'system'),
  ('ev-ir-004', 'cs-import-ready-001', 'lab_result', 'Pesticide Residue Test', 'Lab analysis - all clear', 'hash-lab-ir', 156789, '/evidence/cs-003/lab.pdf', 'shared', 'system'),
  ('ev-ir-005', 'cs-import-ready-001', 'inspection_report', 'Pre-shipment Inspection', 'Physical inspection report', 'hash-inspect-ir', 423567, '/evidence/cs-003/inspection.pdf', 'shared', 'system'),
  ('ev-ir-006', 'cs-import-ready-001', 'treatment_record', 'Hot Water Treatment Record', 'Phytosanitary treatment log', 'hash-treat-ir', 98765, '/evidence/cs-003/treatment.pdf', 'internal', 'system'),
  ('ev-ir-007', 'cs-import-ready-001', 'transport_log', 'Cold Chain Log', 'Temperature monitoring', 'hash-temp-ir', 234567, '/evidence/cs-003/coldchain.pdf', 'internal', 'system'),
  ('ev-ir-008', 'cs-import-ready-001', 'document', 'Packing List', 'Detailed packing manifest', 'hash-pack-ir', 145678, '/evidence/cs-003/packing.pdf', 'shared', 'system');

-- Actors
INSERT INTO actors (id, actor_type, name, organization, email, created_by)
VALUES
  ('actor-senasa-001', 'regulatory_authority', 'Inspector Juan Pérez', 'SENASA', 'jperez@senasa.gob.pe', 'system'),
  ('actor-sgs-001', 'inspector', 'Quality Inspector María López', 'SGS Peru', 'mlopez@sgs.com', 'system'),
  ('actor-lab-001', 'laboratory', 'Lab Technician Carlos Ruiz', 'LabCert Peru', 'cruiz@labcert.pe', 'system');

-- Attestations (5 attestations - all critical ones present)
INSERT INTO attestations (
  id, consignment_id, attestation_type, attested_by_actor_id,
  evidence_id, signature_method, created_by
) VALUES
  ('att-ir-001', 'cs-import-ready-001', 'phyto_cleared', 'actor-senasa-001', 'ev-ir-001', 'digital_signature', 'system'),
  ('att-ir-002', 'cs-import-ready-001', 'export_cleared', 'actor-senasa-001', 'ev-ir-002', 'digital_signature', 'system'),
  ('att-ir-003', 'cs-import-ready-001', 'quality_confirmed', 'actor-sgs-001', 'ev-ir-003', 'digital_signature', 'system'),
  ('att-ir-004', 'cs-import-ready-001', 'inspection_passed', 'actor-sgs-001', 'ev-ir-005', 'digital_signature', 'system'),
  ('att-ir-005', 'cs-import-ready-001', 'docs_complete', 'actor-sgs-001', NULL, 'digital_signature', 'system');

-- Custody Handoffs (4 handoffs - complete chain, no gaps)
INSERT INTO consignment_handoffs (
  id, consignment_id, handoff_type, from_actor_type, to_actor_type,
  from_actor_name, to_actor_name, location, custody_signing_level, created_by
) VALUES
  ('hand-ir-001', 'cs-import-ready-001', 'farm_to_packhouse', 'producer', 'packing_facility', 'Valle Verde Farm', 'Valle Verde Packhouse', 'Piura, Peru', 'dual_signed', 'system'),
  ('hand-ir-002', 'cs-import-ready-001', 'packhouse_to_port', 'packing_facility', 'logistics_provider', 'Valle Verde Packhouse', 'TransPeru Logistics', 'Callao Port', 'dual_signed', 'system'),
  ('hand-ir-003', 'cs-import-ready-001', 'port_to_vessel', 'logistics_provider', 'carrier', 'TransPeru Logistics', 'Maersk Line', 'Callao Port', 'dual_signed', 'system'),
  ('hand-ir-004', 'cs-import-ready-001', 'vessel_to_port', 'carrier', 'customs_broker', 'Maersk Line', 'US Customs Broker', 'Port of Los Angeles', 'receiver_acknowledged', 'system');

-- State Snapshot
INSERT INTO state_snapshots (
  id, consignment_id, readiness_state, evidence_completeness_pct,
  attribution_strength, custody_continuity_score,
  decision_readiness_import, decision_readiness_financing,
  blocking_exception_count, warning_exception_count, created_by
) VALUES (
  'snap-ir-001',
  'cs-import-ready-001',
  'ready',
  100,
  100,
  100,
  true,
  true,
  0,
  0,
  'system'
);

-- No exceptions (all clear)

-- ============================================================================
-- SCENARIO 2: UNDERWRITING-ONLY
-- Ready for financing but not import (missing phyto cert)
-- ============================================================================

INSERT INTO consignment_cases (
  id, case_number, origin_country, destination_country,
  exporter_name, estimated_departure, estimated_arrival,
  current_state, pack_status, created_by
) VALUES (
  'cs-underwriting-only-001',
  'CS-2026-004',
  'PE',
  'US',
  'Exportadora Tropical S.A.',
  '2026-04-20',
  '2026-04-30',
  'partial',
  'stale',
  'system'
);

-- Lots
INSERT INTO lots (id, lot_number, product_type, quantity_kg, origin_region, harvest_date, created_by)
VALUES
  ('lot-uo-001', 'LOT-ET-2026-B01', 'Haden Mango', 4500, 'Lambayeque', '2026-03-18', 'system'),
  ('lot-uo-002', 'LOT-ET-2026-B02', 'Haden Mango', 4700, 'Lambayeque', '2026-03-19', 'system'),
  ('lot-uo-003', 'LOT-ET-2026-B03', 'Haden Mango', 4300, 'Lambayeque', '2026-03-20', 'system');

INSERT INTO consignment_lots (consignment_id, lot_id) VALUES
  ('cs-underwriting-only-001', 'lot-uo-001'),
  ('cs-underwriting-only-001', 'lot-uo-002'),
  ('cs-underwriting-only-001', 'lot-uo-003');

-- Evidence (6 pieces - missing phyto cert and one other)
INSERT INTO evidence_objects (
  id, consignment_id, evidence_type, title, description,
  file_hash, file_size, storage_path, visibility, created_by
) VALUES
  ('ev-uo-001', 'cs-underwriting-only-001', 'certificate', 'Export Clearance Certificate', 'SUNAT export authorization', 'hash-export-uo', 189234, '/evidence/cs-004/export.pdf', 'shared', 'system'),
  ('ev-uo-002', 'cs-underwriting-only-001', 'certificate', 'Quality Certificate', 'SGS quality inspection', 'hash-quality-uo', 312456, '/evidence/cs-004/quality.pdf', 'shared', 'system'),
  ('ev-uo-003', 'cs-underwriting-only-001', 'lab_result', 'Pesticide Residue Test', 'Lab analysis', 'hash-lab-uo', 156789, '/evidence/cs-004/lab.pdf', 'shared', 'system'),
  ('ev-uo-004', 'cs-underwriting-only-001', 'treatment_record', 'Hot Water Treatment Record', 'Treatment log', 'hash-treat-uo', 98765, '/evidence/cs-004/treatment.pdf', 'internal', 'system'),
  ('ev-uo-005', 'cs-underwriting-only-001', 'transport_log', 'Cold Chain Log', 'Temperature monitoring', 'hash-temp-uo', 234567, '/evidence/cs-004/coldchain.pdf', 'internal', 'system'),
  ('ev-uo-006', 'cs-underwriting-only-001', 'document', 'Packing List', 'Packing manifest', 'hash-pack-uo', 145678, '/evidence/cs-004/packing.pdf', 'shared', 'system');

-- Attestations (3 - missing phyto attestation)
INSERT INTO attestations (
  id, consignment_id, attestation_type, attested_by_actor_id,
  evidence_id, signature_method, created_by
) VALUES
  ('att-uo-001', 'cs-underwriting-only-001', 'export_cleared', 'actor-senasa-001', 'ev-uo-001', 'digital_signature', 'system'),
  ('att-uo-002', 'cs-underwriting-only-001', 'quality_confirmed', 'actor-sgs-001', 'ev-uo-002', 'digital_signature', 'system'),
  ('att-uo-003', 'cs-underwriting-only-001', 'docs_complete', 'actor-sgs-001', NULL, 'wet_signature', 'system');

-- Custody (4 handoffs - complete chain)
INSERT INTO consignment_handoffs (
  id, consignment_id, handoff_type, from_actor_type, to_actor_type,
  from_actor_name, to_actor_name, location, custody_signing_level, created_by
) VALUES
  ('hand-uo-001', 'cs-underwriting-only-001', 'farm_to_packhouse', 'producer', 'packing_facility', 'Tropical Farm', 'Tropical Packhouse', 'Lambayeque, Peru', 'dual_signed', 'system'),
  ('hand-uo-002', 'cs-underwriting-only-001', 'packhouse_to_port', 'packing_facility', 'logistics_provider', 'Tropical Packhouse', 'LogiPeru', 'Paita Port', 'dual_signed', 'system'),
  ('hand-uo-003', 'cs-underwriting-only-001', 'port_to_vessel', 'logistics_provider', 'carrier', 'LogiPeru', 'MSC Shipping', 'Paita Port', 'dual_signed', 'system'),
  ('hand-uo-004', 'cs-underwriting-only-001', 'vessel_to_port', 'carrier', 'customs_broker', 'MSC Shipping', 'US Customs Broker', 'Port of Miami', 'receiver_acknowledged', 'system');

-- Exceptions (1 blocking - missing phyto)
INSERT INTO consignment_exceptions (
  id, consignment_id, exception_type, severity, title, description,
  is_resolved, created_by
) VALUES (
  'exc-uo-001',
  'cs-underwriting-only-001',
  'missing_critical_evidence',
  'blocking',
  'Missing Phytosanitary Certificate',
  'Phytosanitary certificate from SENASA is required for US customs clearance',
  false,
  'system'
);

-- State Snapshot
INSERT INTO state_snapshots (
  id, consignment_id, readiness_state, evidence_completeness_pct,
  attribution_strength, custody_continuity_score,
  decision_readiness_import, decision_readiness_financing,
  blocking_exception_count, warning_exception_count, created_by
) VALUES (
  'snap-uo-001',
  'cs-underwriting-only-001',
  'partial',
  75,
  75,
  85,
  false,
  true,
  1,
  0,
  'system'
);

-- ============================================================================
-- SCENARIO 3: DOC-BLOCKED
-- Blocked by missing documentation
-- ============================================================================

INSERT INTO consignment_cases (
  id, case_number, origin_country, destination_country,
  exporter_name, estimated_departure, estimated_arrival,
  current_state, pack_status, created_by
) VALUES (
  'cs-doc-blocked-001',
  'CS-2026-005',
  'PE',
  'US',
  'Frutas del Norte S.A.C.',
  '2026-04-25',
  '2026-05-05',
  'not_ready',
  'not_generated',
  'system'
);

-- Lots
INSERT INTO lots (id, lot_number, product_type, quantity_kg, origin_region, harvest_date, created_by)
VALUES
  ('lot-db-001', 'LOT-FN-2026-C01', 'Tommy Atkins Mango', 3800, 'Piura', '2026-03-15', 'system'),
  ('lot-db-002', 'LOT-FN-2026-C02', 'Tommy Atkins Mango', 4100, 'Piura', '2026-03-16', 'system'),
  ('lot-db-003', 'LOT-FN-2026-C03', 'Tommy Atkins Mango', 3900, 'Piura', '2026-03-17', 'system'),
  ('lot-db-004', 'LOT-FN-2026-C04', 'Tommy Atkins Mango', 4200, 'Piura', '2026-03-18', 'system');

INSERT INTO consignment_lots (consignment_id, lot_id) VALUES
  ('cs-doc-blocked-001', 'lot-db-001'),
  ('cs-doc-blocked-001', 'lot-db-002'),
  ('cs-doc-blocked-001', 'lot-db-003'),
  ('cs-doc-blocked-001', 'lot-db-004');

-- Evidence (3 pieces only - very incomplete)
INSERT INTO evidence_objects (
  id, consignment_id, evidence_type, title, description,
  file_hash, file_size, storage_path, visibility, created_by
) VALUES
  ('ev-db-001', 'cs-doc-blocked-001', 'document', 'Packing List', 'Basic packing list', 'hash-pack-db', 145678, '/evidence/cs-005/packing.pdf', 'shared', 'system'),
  ('ev-db-002', 'cs-doc-blocked-001', 'photo', 'Product Photos', 'Mango photos', 'hash-photo-db', 2345678, '/evidence/cs-005/photos.jpg', 'internal', 'system'),
  ('ev-db-003', 'cs-doc-blocked-001', 'transport_log', 'Transport Log', 'Partial transport log', 'hash-trans-db', 123456, '/evidence/cs-005/transport.pdf', 'internal', 'system');

-- No attestations yet

-- Custody (3 handoffs - complete so far)
INSERT INTO consignment_handoffs (
  id, consignment_id, handoff_type, from_actor_type, to_actor_type,
  from_actor_name, to_actor_name, location, custody_signing_level, created_by
) VALUES
  ('hand-db-001', 'cs-doc-blocked-001', 'farm_to_packhouse', 'producer', 'packing_facility', 'Norte Farm', 'Norte Packhouse', 'Piura, Peru', 'dual_signed', 'system'),
  ('hand-db-002', 'cs-doc-blocked-001', 'packhouse_to_port', 'packing_facility', 'logistics_provider', 'Norte Packhouse', 'FastLog Peru', 'Paita Port', 'sender_signed', 'system'),
  ('hand-db-003', 'cs-doc-blocked-001', 'port_to_vessel', 'logistics_provider', 'carrier', 'FastLog Peru', 'CMA CGM', 'Paita Port', 'unsigned', 'system');

-- Exceptions (3 blocking)
INSERT INTO consignment_exceptions (
  id, consignment_id, exception_type, severity, title, description,
  is_resolved, created_by
) VALUES
  ('exc-db-001', 'cs-doc-blocked-001', 'missing_critical_evidence', 'blocking', 'Missing Phytosanitary Certificate', 'Required for US import', false, 'system'),
  ('exc-db-002', 'cs-doc-blocked-001', 'missing_critical_evidence', 'blocking', 'Missing Export Clearance', 'SUNAT export authorization required', false, 'system'),
  ('exc-db-003', 'cs-doc-blocked-001', 'missing_critical_evidence', 'blocking', 'Missing Quality Certificate', 'Third-party quality inspection required', false, 'system');

-- State Snapshot
INSERT INTO state_snapshots (
  id, consignment_id, readiness_state, evidence_completeness_pct,
  attribution_strength, custody_continuity_score,
  decision_readiness_import, decision_readiness_financing,
  blocking_exception_count, warning_exception_count, created_by
) VALUES (
  'snap-db-001',
  'cs-doc-blocked-001',
  'not_ready',
  38,
  25,
  60,
  false,
  false,
  3,
  0,
  'system'
);

-- ============================================================================
-- SCENARIO 4: CUSTODY-BLOCKED
-- Blocked by custody gaps
-- ============================================================================

INSERT INTO consignment_cases (
  id, case_number, origin_country, destination_country,
  exporter_name, estimated_departure, estimated_arrival,
  current_state, pack_status, created_by
) VALUES (
  'cs-custody-blocked-001',
  'CS-2026-006',
  'PE',
  'US',
  'Mango Export Pro S.A.C.',
  '2026-04-18',
  '2026-04-28',
  'not_ready',
  'not_generated',
  'system'
);

-- Lots
INSERT INTO lots (id, lot_number, product_type, quantity_kg, origin_region, harvest_date, created_by)
VALUES
  ('lot-cb-001', 'LOT-MEP-2026-D01', 'Kent Mango', 5500, 'Lambayeque', '2026-03-12', 'system'),
  ('lot-cb-002', 'LOT-MEP-2026-D02', 'Kent Mango', 5300, 'Lambayeque', '2026-03-13', 'system'),
  ('lot-cb-003', 'LOT-MEP-2026-D03', 'Kent Mango', 5400, 'Lambayeque', '2026-03-14', 'system');

INSERT INTO consignment_lots (consignment_id, lot_id) VALUES
  ('cs-custody-blocked-001', 'lot-cb-001'),
  ('cs-custody-blocked-001', 'lot-cb-002'),
  ('cs-custody-blocked-001', 'lot-cb-003');

-- Evidence (7 pieces - good coverage)
INSERT INTO evidence_objects (
  id, consignment_id, evidence_type, title, description,
  file_hash, file_size, storage_path, visibility, created_by
) VALUES
  ('ev-cb-001', 'cs-custody-blocked-001', 'certificate', 'Phytosanitary Certificate', 'SENASA clearance', 'hash-phyto-cb', 245678, '/evidence/cs-006/phyto.pdf', 'shared', 'system'),
  ('ev-cb-002', 'cs-custody-blocked-001', 'certificate', 'Export Clearance Certificate', 'SUNAT authorization', 'hash-export-cb', 189234, '/evidence/cs-006/export.pdf', 'shared', 'system'),
  ('ev-cb-003', 'cs-custody-blocked-001', 'certificate', 'Quality Certificate', 'Quality inspection', 'hash-quality-cb', 312456, '/evidence/cs-006/quality.pdf', 'shared', 'system'),
  ('ev-cb-004', 'cs-custody-blocked-001', 'lab_result', 'Lab Test Results', 'Pesticide analysis', 'hash-lab-cb', 156789, '/evidence/cs-006/lab.pdf', 'shared', 'system'),
  ('ev-cb-005', 'cs-custody-blocked-001', 'inspection_report', 'Inspection Report', 'Pre-shipment inspection', 'hash-inspect-cb', 423567, '/evidence/cs-006/inspection.pdf', 'shared', 'system'),
  ('ev-cb-006', 'cs-custody-blocked-001', 'treatment_record', 'Treatment Record', 'Phyto treatment', 'hash-treat-cb', 98765, '/evidence/cs-006/treatment.pdf', 'internal', 'system'),
  ('ev-cb-007', 'cs-custody-blocked-001', 'document', 'Packing List', 'Packing manifest', 'hash-pack-cb', 145678, '/evidence/cs-006/packing.pdf', 'shared', 'system');

-- Attestations (4 - good)
INSERT INTO attestations (
  id, consignment_id, attestation_type, attested_by_actor_id,
  evidence_id, signature_method, created_by
) VALUES
  ('att-cb-001', 'cs-custody-blocked-001', 'phyto_cleared', 'actor-senasa-001', 'ev-cb-001', 'digital_signature', 'system'),
  ('att-cb-002', 'cs-custody-blocked-001', 'export_cleared', 'actor-senasa-001', 'ev-cb-002', 'digital_signature', 'system'),
  ('att-cb-003', 'cs-custody-blocked-001', 'quality_confirmed', 'actor-sgs-001', 'ev-cb-003', 'digital_signature', 'system'),
  ('att-cb-004', 'cs-custody-blocked-001', 'inspection_passed', 'actor-sgs-001', 'ev-cb-005', 'digital_signature', 'system');

-- Custody (5 handoffs with 2 GAPS)
INSERT INTO consignment_handoffs (
  id, consignment_id, handoff_type, from_actor_type, to_actor_type,
  from_actor_name, to_actor_name, location, custody_signing_level, created_by
) VALUES
  ('hand-cb-001', 'cs-custody-blocked-001', 'farm_to_packhouse', 'producer', 'packing_facility', 'ExportPro Farm', 'ExportPro Packhouse', 'Lambayeque, Peru', 'dual_signed', 'system'),
  -- GAP 1: Missing packhouse_to_port handoff
  ('hand-cb-002', 'cs-custody-blocked-001', 'port_to_vessel', 'logistics_provider', 'carrier', 'Unknown Logistics', 'Hapag-Lloyd', 'Callao Port', 'unsigned', 'system'),
  -- GAP 2: Missing vessel_to_port handoff
  ('hand-cb-003', 'cs-custody-blocked-001', 'port_to_warehouse', 'customs_broker', 'warehouse', 'US Broker', 'Cold Storage LA', 'Los Angeles', 'sender_signed', 'system');

-- Exceptions (2 blocking - custody gaps)
INSERT INTO consignment_exceptions (
  id, consignment_id, exception_type, severity, title, description,
  is_resolved, created_by
) VALUES
  ('exc-cb-001', 'cs-custody-blocked-001', 'custody_gap_detected', 'blocking', 'Custody Gap: Packhouse to Port', 'Missing handoff record between packhouse and port logistics', false, 'system'),
  ('exc-cb-002', 'cs-custody-blocked-001', 'custody_gap_detected', 'blocking', 'Custody Gap: Vessel to Port', 'Missing handoff record from vessel arrival to port custody', false, 'system');

-- State Snapshot
INSERT INTO state_snapshots (
  id, consignment_id, readiness_state, evidence_completeness_pct,
  attribution_strength, custody_continuity_score,
  decision_readiness_import, decision_readiness_financing,
  blocking_exception_count, warning_exception_count, created_by
) VALUES (
  'snap-cb-001',
  'cs-custody-blocked-001',
  'not_ready',
  88,
  80,
  40,
  false,
  false,
  2,
  0,
  'system'
);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- CS-2026-003: Import-Ready (8 evidence, 5 attestations, 4 handoffs, 0 exceptions)
-- CS-2026-004: Underwriting-Only (6 evidence, 3 attestations, 4 handoffs, 1 exception)
-- CS-2026-005: Doc-Blocked (3 evidence, 0 attestations, 3 handoffs, 3 exceptions)
-- CS-2026-006: Custody-Blocked (7 evidence, 4 attestations, 3 handoffs with gaps, 2 exceptions)
-- ============================================================================
