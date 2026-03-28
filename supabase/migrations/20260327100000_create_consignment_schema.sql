-- ============================================
-- MIGRATION: Consignment-Centric Schema
-- Stage 2 — Export Manager First
-- ============================================
-- Fecha: 2026-03-27
-- Objetivo: Consignment Case como objeto raíz de decisión
-- Lots pasan a ser subordinados de consignaciones
-- Consumer-first eliminado

-- ============================================
-- 1. ENUMS
-- ============================================

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

-- ============================================
-- 2. TABLA: consignment_cases (objeto raíz)
-- ============================================

CREATE TABLE consignment_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(100) UNIQUE NOT NULL,
  exporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  importer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  destination_country VARCHAR(100) NOT NULL,
  destination_port VARCHAR(255),
  incoterm VARCHAR(10),
  status consignment_status NOT NULL DEFAULT 'draft',
  readiness readiness_state NOT NULL DEFAULT 'not_ready',
  total_pallets INTEGER DEFAULT 0,
  total_kg NUMERIC(12, 2) DEFAULT 0,
  estimated_departure DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint formato case_number: CS-YYYY-NNN
ALTER TABLE consignment_cases ADD CONSTRAINT check_case_number_format
  CHECK (case_number ~ '^CS-\d{4}-\d{3,6}$');

-- Índices
CREATE UNIQUE INDEX idx_cc_case_number ON consignment_cases(case_number);
CREATE INDEX idx_cc_exporter ON consignment_cases(exporter_id);
CREATE INDEX idx_cc_importer ON consignment_cases(importer_id);
CREATE INDEX idx_cc_status ON consignment_cases(status);
CREATE INDEX idx_cc_readiness ON consignment_cases(readiness);
CREATE INDEX idx_cc_created_at ON consignment_cases(created_at DESC);
CREATE INDEX idx_cc_destination ON consignment_cases(destination_country);

COMMENT ON TABLE consignment_cases IS 'Objeto raíz: caso de consignación para exportación/importación';
COMMENT ON COLUMN consignment_cases.case_number IS 'ID legible único (CS-2026-001)';
COMMENT ON COLUMN consignment_cases.readiness IS 'Estado de readiness computado';

-- ============================================
-- 3. TABLA: consignment_lots (junction)
-- ============================================

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

COMMENT ON TABLE consignment_lots IS 'Lotes asignados a una consignación';

-- ============================================
-- 4. TABLA: consignment_documents (evidencia)
-- ============================================

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
CREATE INDEX idx_cd_verified ON consignment_documents(verified);

COMMENT ON TABLE consignment_documents IS 'Documentos de soporte de una consignación';

-- ============================================
-- 5. TABLA: consignment_attestations
-- ============================================

CREATE TABLE consignment_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  att_type attestation_type NOT NULL,
  attested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  role_at_time VARCHAR(100) NOT NULL,
  statement TEXT,
  evidence_refs UUID[] DEFAULT '{}',
  attested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ca_consignment ON consignment_attestations(consignment_id);
CREATE INDEX idx_ca_type ON consignment_attestations(att_type);
CREATE INDEX idx_ca_attested_by ON consignment_attestations(attested_by);
CREATE INDEX idx_ca_revoked ON consignment_attestations(revoked);

COMMENT ON TABLE consignment_attestations IS 'Assertions humanas sobre compliance de una consignación';

-- ============================================
-- 6. TABLA: consignment_handoffs (custodia)
-- ============================================

CREATE TABLE consignment_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE CASCADE,
  from_party_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_party_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ho_type handoff_type NOT NULL,
  location VARCHAR(255),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  condition_notes TEXT,
  temperature_c NUMERIC(5, 2),
  evidence_refs UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ch_consignment ON consignment_handoffs(consignment_id);
CREATE INDEX idx_ch_type ON consignment_handoffs(ho_type);
CREATE INDEX idx_ch_occurred ON consignment_handoffs(occurred_at DESC);

COMMENT ON TABLE consignment_handoffs IS 'Transferencias de custodia de una consignación';

-- ============================================
-- 7. TABLA: consignment_exceptions
-- ============================================

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
CREATE INDEX idx_ce_type ON consignment_exceptions(exc_type);
CREATE INDEX idx_ce_severity ON consignment_exceptions(severity);
CREATE INDEX idx_ce_resolved ON consignment_exceptions(resolved);
CREATE INDEX idx_ce_blocks ON consignment_exceptions(blocks_readiness) WHERE blocks_readiness = true;

COMMENT ON TABLE consignment_exceptions IS 'Excepciones, holds y claims de una consignación';

-- ============================================
-- 8. TABLA: consignment_events (timeline)
-- ============================================

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
CREATE INDEX idx_cev_type ON consignment_events(event_type);
CREATE INDEX idx_cev_category ON consignment_events(event_category);
CREATE INDEX idx_cev_occurred ON consignment_events(occurred_at DESC);

COMMENT ON TABLE consignment_events IS 'Timeline append-only de una consignación';

-- ============================================
-- 9. TRIGGERS
-- ============================================

-- Auto updated_at para consignment_cases
CREATE TRIGGER update_cc_updated_at
  BEFORE UPDATE ON consignment_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Evento automático al crear consignment
CREATE OR REPLACE FUNCTION create_consignment_initial_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consignment_events (
    consignment_id, event_type, event_category,
    actor_id, description
  ) VALUES (
    NEW.id, 'case.created', 'lifecycle',
    NEW.exporter_id, 'Consignment case created'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cc_initial_event
  AFTER INSERT ON consignment_cases
  FOR EACH ROW
  EXECUTE FUNCTION create_consignment_initial_event();

-- Evento automático al agregar lote
CREATE OR REPLACE FUNCTION log_lot_added_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consignment_events (
    consignment_id, event_type, event_category,
    ref_id, description
  ) VALUES (
    NEW.consignment_id, 'lot.added', 'lifecycle',
    NEW.lot_id,
    'Lot assigned to consignment (seq ' || NEW.sequence_number || ')'
  );

  -- Actualizar totales de la consignación
  UPDATE consignment_cases SET
    total_pallets = (
      SELECT COUNT(*) FROM consignment_lots WHERE consignment_id = NEW.consignment_id
    ),
    total_kg = COALESCE((
      SELECT SUM(NULLIF(la.attribute_value, '')::numeric)
      FROM consignment_lots cl
      JOIN lot_attributes la ON la.lot_id = cl.lot_id AND la.attribute_key = 'total_kg'
      WHERE cl.consignment_id = NEW.consignment_id
    ), 0)
  WHERE id = NEW.consignment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lot_added
  AFTER INSERT ON consignment_lots
  FOR EACH ROW
  EXECUTE FUNCTION log_lot_added_event();

-- Evento automático al agregar documento
CREATE OR REPLACE FUNCTION log_document_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consignment_events (
    consignment_id, event_type, event_category,
    ref_id, description
  ) VALUES (
    NEW.consignment_id, 'document.uploaded', 'document',
    NEW.id, NEW.doc_type::text || ': ' || NEW.title
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_added
  AFTER INSERT ON consignment_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_event();

-- Evento automático al verificar documento
CREATE OR REPLACE FUNCTION log_document_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified = true AND (OLD.verified IS DISTINCT FROM true) THEN
    INSERT INTO consignment_events (
      consignment_id, event_type, event_category,
      actor_id, ref_id, description
    ) VALUES (
      NEW.consignment_id, 'document.verified', 'document',
      NEW.verified_by, NEW.id,
      NEW.doc_type::text || ' verified: ' || NEW.title
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_verified
  AFTER UPDATE ON consignment_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_verified();

-- Evento automático al crear attestation
CREATE OR REPLACE FUNCTION log_attestation_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consignment_events (
    consignment_id, event_type, event_category,
    actor_id, ref_id, description
  ) VALUES (
    NEW.consignment_id, 'attestation.created', 'attestation',
    NEW.attested_by, NEW.id,
    NEW.att_type::text || ' by ' || NEW.role_at_time
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_attestation_created
  AFTER INSERT ON consignment_attestations
  FOR EACH ROW
  EXECUTE FUNCTION log_attestation_event();

-- Evento automático al crear handoff
CREATE OR REPLACE FUNCTION log_handoff_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consignment_events (
    consignment_id, event_type, event_category,
    ref_id, location, description
  ) VALUES (
    NEW.consignment_id, 'handoff.completed', 'handoff',
    NEW.id, NEW.location,
    NEW.ho_type::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handoff_created
  AFTER INSERT ON consignment_handoffs
  FOR EACH ROW
  EXECUTE FUNCTION log_handoff_event();

-- Evento automático al crear excepción
CREATE OR REPLACE FUNCTION log_exception_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consignment_events (
    consignment_id, event_type, event_category,
    actor_id, ref_id, description
  ) VALUES (
    NEW.consignment_id, 'exception.raised', 'exception',
    NEW.raised_by, NEW.id,
    NEW.severity::text || ': ' || NEW.title
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exception_raised
  AFTER INSERT ON consignment_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION log_exception_event();

-- Evento automático al resolver excepción
CREATE OR REPLACE FUNCTION log_exception_resolved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resolved = true AND OLD.resolved = false THEN
    INSERT INTO consignment_events (
      consignment_id, event_type, event_category,
      actor_id, ref_id, description
    ) VALUES (
      NEW.consignment_id, 'exception.resolved', 'exception',
      NEW.resolved_by, NEW.id,
      'Resolved: ' || NEW.title
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exception_resolved
  AFTER UPDATE ON consignment_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION log_exception_resolved();

-- ============================================
-- 10. FUNCIÓN: compute_consignment_readiness
-- ============================================

CREATE OR REPLACE FUNCTION compute_consignment_readiness(p_consignment_id UUID)
RETURNS readiness_state AS $$
DECLARE
  v_has_lots BOOLEAN;
  v_has_phyto BOOLEAN;
  v_has_origin_cert BOOLEAN;
  v_has_packing BOOLEAN;
  v_has_invoice BOOLEAN;
  v_has_bol BOOLEAN;
  v_has_customs BOOLEAN;
  v_blocking_exceptions INTEGER;
  v_att_quality BOOLEAN;
  v_att_docs BOOLEAN;
  v_att_export BOOLEAN;
  v_att_import BOOLEAN;
  v_att_customs BOOLEAN;
  v_result readiness_state;
BEGIN
  -- Check: tiene lotes?
  SELECT EXISTS(
    SELECT 1 FROM consignment_lots WHERE consignment_id = p_consignment_id
  ) INTO v_has_lots;

  IF NOT v_has_lots THEN
    RETURN 'not_ready';
  END IF;

  -- Check: documentos verificados
  SELECT
    EXISTS(SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'phytosanitary_cert' AND verified = true),
    EXISTS(SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'certificate_of_origin' AND verified = true),
    EXISTS(SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'packing_list'),
    EXISTS(SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'commercial_invoice'),
    EXISTS(SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'bill_of_lading' AND verified = true),
    EXISTS(SELECT 1 FROM consignment_documents WHERE consignment_id = p_consignment_id AND doc_type = 'customs_declaration')
  INTO v_has_phyto, v_has_origin_cert, v_has_packing, v_has_invoice, v_has_bol, v_has_customs;

  -- Check: excepciones blocking sin resolver
  SELECT COUNT(*) FROM consignment_exceptions
  WHERE consignment_id = p_consignment_id
    AND blocks_readiness = true
    AND resolved = false
  INTO v_blocking_exceptions;

  -- Check: attestations (no revocadas)
  SELECT
    EXISTS(SELECT 1 FROM consignment_attestations WHERE consignment_id = p_consignment_id AND att_type = 'quality_confirmed' AND revoked = false),
    EXISTS(SELECT 1 FROM consignment_attestations WHERE consignment_id = p_consignment_id AND att_type = 'docs_complete' AND revoked = false),
    EXISTS(SELECT 1 FROM consignment_attestations WHERE consignment_id = p_consignment_id AND att_type = 'export_cleared' AND revoked = false),
    EXISTS(SELECT 1 FROM consignment_attestations WHERE consignment_id = p_consignment_id AND att_type = 'import_cleared' AND revoked = false),
    EXISTS(SELECT 1 FROM consignment_attestations WHERE consignment_id = p_consignment_id AND att_type = 'customs_released' AND revoked = false)
  INTO v_att_quality, v_att_docs, v_att_export, v_att_import, v_att_customs;

  -- Compute readiness progresivamente
  IF v_blocking_exceptions > 0 THEN
    RETURN 'not_ready';
  END IF;

  IF NOT (v_has_packing AND v_has_invoice) THEN
    RETURN 'docs_pending';
  END IF;

  IF NOT (v_has_phyto AND v_has_origin_cert) THEN
    RETURN 'docs_pending';
  END IF;

  IF v_att_docs THEN
    v_result := 'docs_complete';
  ELSE
    RETURN 'docs_pending';
  END IF;

  IF v_att_quality THEN
    v_result := 'inspection_passed';
  ELSE
    RETURN 'inspection_pending';
  END IF;

  IF v_att_export THEN
    v_result := 'export_ready';
  ELSE
    RETURN v_result;
  END IF;

  IF v_has_bol AND v_att_import THEN
    v_result := 'import_ready';
  ELSE
    RETURN v_result;
  END IF;

  IF v_has_customs AND v_att_customs THEN
    RETURN 'fully_cleared';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION compute_consignment_readiness IS 'Computa el estado de readiness de una consignación basado en docs, attestations y excepciones';

-- ============================================
-- 11. FUNCIÓN RPC: create_consignment_case
-- ============================================

CREATE OR REPLACE FUNCTION create_consignment_case(
  p_case_number VARCHAR,
  p_exporter_id UUID,
  p_destination_country VARCHAR,
  p_destination_port VARCHAR DEFAULT NULL,
  p_incoterm VARCHAR DEFAULT NULL,
  p_estimated_departure DATE DEFAULT NULL,
  p_importer_id UUID DEFAULT NULL
)
RETURNS TABLE (
  case_uuid UUID,
  case_case_number VARCHAR
) AS $$
DECLARE
  v_case_id UUID;
BEGIN
  INSERT INTO consignment_cases (
    case_number, exporter_id, importer_id,
    destination_country, destination_port,
    incoterm, estimated_departure
  ) VALUES (
    p_case_number, p_exporter_id, p_importer_id,
    p_destination_country, p_destination_port,
    p_incoterm, p_estimated_departure
  )
  RETURNING id INTO v_case_id;

  -- Trigger crea evento inicial automáticamente

  RETURN QUERY SELECT v_case_id, p_case_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_consignment_case IS 'Crea un nuevo consignment case con evento inicial';

-- ============================================
-- 12. FUNCIÓN RPC: get_consignment_with_details
-- ============================================

CREATE OR REPLACE FUNCTION get_consignment_with_details(p_case_number VARCHAR)
RETURNS TABLE (
  case_uuid UUID,
  case_number VARCHAR,
  exporter_name VARCHAR,
  importer_name VARCHAR,
  destination_country VARCHAR,
  destination_port VARCHAR,
  incoterm VARCHAR,
  status consignment_status,
  readiness readiness_state,
  total_pallets INTEGER,
  total_kg NUMERIC,
  estimated_departure DATE,
  created_at TIMESTAMPTZ,
  lot_count BIGINT,
  doc_count BIGINT,
  verified_doc_count BIGINT,
  attestation_count BIGINT,
  open_exceptions BIGINT,
  blocking_exceptions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.case_number,
    exp.full_name as exporter_name,
    imp.full_name as importer_name,
    cc.destination_country,
    cc.destination_port,
    cc.incoterm,
    cc.status,
    cc.readiness,
    cc.total_pallets,
    cc.total_kg,
    cc.estimated_departure,
    cc.created_at,
    (SELECT COUNT(*) FROM consignment_lots cl WHERE cl.consignment_id = cc.id),
    (SELECT COUNT(*) FROM consignment_documents cd WHERE cd.consignment_id = cc.id),
    (SELECT COUNT(*) FROM consignment_documents cd WHERE cd.consignment_id = cc.id AND cd.verified = true),
    (SELECT COUNT(*) FROM consignment_attestations ca WHERE ca.consignment_id = cc.id AND ca.revoked = false),
    (SELECT COUNT(*) FROM consignment_exceptions ce WHERE ce.consignment_id = cc.id AND ce.resolved = false),
    (SELECT COUNT(*) FROM consignment_exceptions ce WHERE ce.consignment_id = cc.id AND ce.blocks_readiness = true AND ce.resolved = false)
  FROM consignment_cases cc
  LEFT JOIN profiles exp ON cc.exporter_id = exp.id
  LEFT JOIN profiles imp ON cc.importer_id = imp.id
  WHERE cc.case_number = p_case_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_consignment_with_details IS 'Obtiene un consignment case con conteos de entidades relacionadas';

-- ============================================
-- 13. FUNCIÓN: refresh_consignment_readiness
-- ============================================

CREATE OR REPLACE FUNCTION refresh_consignment_readiness(p_consignment_id UUID)
RETURNS readiness_state AS $$
DECLARE
  v_new_readiness readiness_state;
  v_old_readiness readiness_state;
BEGIN
  SELECT readiness INTO v_old_readiness
  FROM consignment_cases WHERE id = p_consignment_id;

  v_new_readiness := compute_consignment_readiness(p_consignment_id);

  IF v_new_readiness IS DISTINCT FROM v_old_readiness THEN
    UPDATE consignment_cases
    SET readiness = v_new_readiness
    WHERE id = p_consignment_id;

    -- Log readiness change event
    INSERT INTO consignment_events (
      consignment_id, event_type, event_category, description
    ) VALUES (
      p_consignment_id, 'readiness.changed', 'readiness',
      'Readiness changed: ' || v_old_readiness::text || ' → ' || v_new_readiness::text
    );
  END IF;

  RETURN v_new_readiness;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_consignment_readiness IS 'Recomputa y actualiza el readiness state de una consignación';

-- ============================================
-- 14. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE consignment_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_events ENABLE ROW LEVEL SECURITY;

-- consignment_cases: visible por exporter e importer
CREATE POLICY "Cases viewable by participants"
  ON consignment_cases FOR SELECT
  USING (
    auth.uid() = exporter_id
    OR auth.uid() = importer_id
  );

CREATE POLICY "Exporters can create cases"
  ON consignment_cases FOR INSERT
  WITH CHECK (auth.uid() = exporter_id);

CREATE POLICY "Exporters can update own cases"
  ON consignment_cases FOR UPDATE
  USING (auth.uid() = exporter_id);

-- consignment_lots: visible si puedes ver la consignación
CREATE POLICY "Lots viewable via consignment access"
  ON consignment_lots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_lots.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "Exporters can assign lots"
  ON consignment_lots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_lots.consignment_id
        AND cc.exporter_id = auth.uid()
    )
  );

-- consignment_documents: visible via consignment
CREATE POLICY "Docs viewable via consignment access"
  ON consignment_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_documents.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can upload docs"
  ON consignment_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_documents.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can verify docs"
  ON consignment_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_documents.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

-- consignment_attestations: visible via consignment
CREATE POLICY "Attestations viewable via consignment"
  ON consignment_attestations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_attestations.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can attest"
  ON consignment_attestations FOR INSERT
  WITH CHECK (auth.uid() = attested_by);

-- consignment_handoffs
CREATE POLICY "Handoffs viewable via consignment"
  ON consignment_handoffs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_handoffs.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can log handoffs"
  ON consignment_handoffs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_handoffs.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

-- consignment_exceptions
CREATE POLICY "Exceptions viewable via consignment"
  ON consignment_exceptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_exceptions.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can raise exceptions"
  ON consignment_exceptions FOR INSERT
  WITH CHECK (auth.uid() = raised_by);

CREATE POLICY "Participants can resolve exceptions"
  ON consignment_exceptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_exceptions.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

-- consignment_events: append-only, viewable via consignment
CREATE POLICY "Events viewable via consignment"
  ON consignment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = consignment_events.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "System can insert events"
  ON consignment_events FOR INSERT
  WITH CHECK (true);

-- NO UPDATE/DELETE en consignment_events (append-only)

-- ============================================
-- FIN DE MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Consignment Schema created successfully';
  RAISE NOTICE 'Tables: consignment_cases, consignment_lots, consignment_documents, consignment_attestations, consignment_handoffs, consignment_exceptions, consignment_events';
  RAISE NOTICE 'Functions: create_consignment_case, get_consignment_with_details, compute_consignment_readiness, refresh_consignment_readiness';
  RAISE NOTICE 'Triggers: auto events on insert/update for all child entities';
  RAISE NOTICE 'RLS: participant-scoped access on all tables';
END $$;
