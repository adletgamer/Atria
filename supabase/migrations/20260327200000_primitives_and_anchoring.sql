-- ============================================
-- MIGRATION: Protocol Primitives + Evidence Anchoring
-- ============================================
-- Fecha: 2026-03-27
-- Objetivo: Definir las 9 primitives del protocolo y la
--           arquitectura hybrid on-chain/off-chain
--
-- Nuevas tablas: evidence_objects, state_transitions, anchors
-- Refina: consignment_cases, consignment_attestations, lots
-- Reemplaza: consignment_status enum con case_state (decision-linked)

-- ============================================
-- 1. NUEVOS ENUMS
-- ============================================

-- Estado formal ligado a decisión, no narrativa
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

-- ============================================
-- 2. TABLA: evidence_objects (Primitive 5)
-- ============================================

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
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content_hash es inmutable después de creación: NO UPDATE policy
CREATE INDEX idx_eo_consignment ON evidence_objects(consignment_id);
CREATE INDEX idx_eo_lot ON evidence_objects(lot_id);
CREATE INDEX idx_eo_type ON evidence_objects(evidence_type);
CREATE INDEX idx_eo_hash ON evidence_objects(content_hash);
CREATE INDEX idx_eo_created_by ON evidence_objects(created_by);
CREATE INDEX idx_eo_created_at ON evidence_objects(created_at DESC);

COMMENT ON TABLE evidence_objects IS 'Primitive 5: Evidence Object — archivo, registro o payload que soporta una afirmación';
COMMENT ON COLUMN evidence_objects.content_hash IS 'SHA-256 del contenido. Inmutable. Base para anchoring on-chain';
COMMENT ON COLUMN evidence_objects.storage_uri IS 'URI en Supabase Storage (privado) o sistema externo';

-- ============================================
-- 3. TABLA: state_transitions (Primitive 3)
-- ============================================

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

-- Append-only: NO UPDATE, NO DELETE
CREATE INDEX idx_st_consignment ON state_transitions(consignment_id);
CREATE INDEX idx_st_to_state ON state_transitions(to_state);
CREATE INDEX idx_st_actor ON state_transitions(actor_id);
CREATE INDEX idx_st_transitioned ON state_transitions(transitioned_at DESC);

COMMENT ON TABLE state_transitions IS 'Primitive 3: State Transition — cambio formal de estado ligado a decisión';
COMMENT ON COLUMN state_transitions.from_state IS 'NULL en la primera transición (draft)';
COMMENT ON COLUMN state_transitions.evidence_refs IS 'UUIDs de evidence_objects que soportan esta transición';

-- ============================================
-- 4. TABLA: anchors (Primitive 8)
-- ============================================

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

-- Append-only: anchors son inmutables
CREATE INDEX idx_anc_consignment ON anchors(consignment_id);
CREATE INDEX idx_anc_type ON anchors(anchor_type);
CREATE INDEX idx_anc_root_hash ON anchors(root_hash);
CREATE INDEX idx_anc_chain_tx ON anchors(chain_tx);
CREATE INDEX idx_anc_anchored ON anchors(anchored_at DESC);

COMMENT ON TABLE anchors IS 'Primitive 8: Anchor — compromiso criptográfico del evidence bundle o estado';
COMMENT ON COLUMN anchors.root_hash IS 'Merkle root o bundle hash del evidence pack';
COMMENT ON COLUMN anchors.chain_tx IS 'Transaction hash on-chain (null si aún no anclado)';
COMMENT ON COLUMN anchors.input_hashes IS 'Hashes individuales que componen el root_hash';
COMMENT ON COLUMN anchors.anchor_scope IS 'Qué cubre este anchor: {consignment_id, lot_ids[], event_range, etc.}';

-- ============================================
-- 5. REFINAR: consignment_cases
-- ============================================

-- Agregar current_state formal (case_state)
ALTER TABLE consignment_cases
  ADD COLUMN current_state case_state NOT NULL DEFAULT 'draft';

-- Agregar risk_status
ALTER TABLE consignment_cases
  ADD COLUMN risk_status VARCHAR(50) NOT NULL DEFAULT 'normal';

-- Agregar shipment_window
ALTER TABLE consignment_cases
  ADD COLUMN shipment_window_start DATE,
  ADD COLUMN shipment_window_end DATE;

-- Index para current_state
CREATE INDEX idx_cc_current_state ON consignment_cases(current_state);

COMMENT ON COLUMN consignment_cases.current_state IS 'Estado formal ligado a decisión. Actualizado por state_transitions';
COMMENT ON COLUMN consignment_cases.risk_status IS 'normal | elevated | critical | blocked';

-- ============================================
-- 6. REFINAR: consignment_attestations (Primitive 4)
-- ============================================

ALTER TABLE consignment_attestations
  ADD COLUMN claim_type VARCHAR(100),
  ADD COLUMN sig_method signature_method NOT NULL DEFAULT 'platform_auth',
  ADD COLUMN superseded_by UUID REFERENCES consignment_attestations(id),
  ADD COLUMN supersedes UUID REFERENCES consignment_attestations(id);

COMMENT ON COLUMN consignment_attestations.claim_type IS 'Tipo de claim específico (treatment_performed, supervision_completed, etc.)';
COMMENT ON COLUMN consignment_attestations.sig_method IS 'Método de firma/autenticación del attestor';
COMMENT ON COLUMN consignment_attestations.superseded_by IS 'Si esta attestation fue reemplazada por otra';
COMMENT ON COLUMN consignment_attestations.supersedes IS 'Si esta attestation reemplaza a otra anterior';

-- ============================================
-- 7. REFINAR: consignment_handoffs (Primitive 6)
-- ============================================

ALTER TABLE consignment_handoffs
  ADD COLUMN seal_refs TEXT[],
  ADD COLUMN container_refs TEXT[],
  ADD COLUMN receiver_ack BOOLEAN DEFAULT false,
  ADD COLUMN receiver_ack_at TIMESTAMPTZ,
  ADD COLUMN receiver_ack_by UUID REFERENCES profiles(id);

COMMENT ON COLUMN consignment_handoffs.seal_refs IS 'Referencias a sellos físicos';
COMMENT ON COLUMN consignment_handoffs.container_refs IS 'Referencias a contenedores';
COMMENT ON COLUMN consignment_handoffs.receiver_ack IS 'Acknowledgment del receptor';

-- ============================================
-- 8. REFINAR: lots (Primitive 1)
-- ============================================

ALTER TABLE lots
  ADD COLUMN harvest_window_start DATE,
  ADD COLUMN harvest_window_end DATE;

COMMENT ON COLUMN lots.harvest_window_start IS 'Inicio de la ventana de cosecha';
COMMENT ON COLUMN lots.harvest_window_end IS 'Fin de la ventana de cosecha';

-- ============================================
-- 9. TRIGGERS
-- ============================================

-- Trigger: state_transition actualiza current_state en consignment_cases
CREATE OR REPLACE FUNCTION apply_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE consignment_cases
  SET current_state = NEW.to_state
  WHERE id = NEW.consignment_id;

  -- Log event
  INSERT INTO consignment_events (
    consignment_id, event_type, event_category,
    actor_id, ref_id, description
  ) VALUES (
    NEW.consignment_id, 'state.transitioned', 'lifecycle',
    NEW.actor_id, NEW.id,
    COALESCE(NEW.from_state::text, 'null') || ' → ' || NEW.to_state::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_apply_state_transition
  AFTER INSERT ON state_transitions
  FOR EACH ROW
  EXECUTE FUNCTION apply_state_transition();

-- Trigger: evidence_object registra evento
CREATE OR REPLACE FUNCTION log_evidence_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consignment_id IS NOT NULL THEN
    INSERT INTO consignment_events (
      consignment_id, event_type, event_category,
      actor_id, ref_id, description
    ) VALUES (
      NEW.consignment_id, 'evidence.attached', 'document',
      NEW.created_by, NEW.id,
      NEW.evidence_type::text || ': ' || COALESCE(NEW.title, 'untitled')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_evidence_added
  AFTER INSERT ON evidence_objects
  FOR EACH ROW
  EXECUTE FUNCTION log_evidence_event();

-- Trigger: anchor registra evento
CREATE OR REPLACE FUNCTION log_anchor_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consignment_events (
    consignment_id, event_type, event_category,
    ref_id, description
  ) VALUES (
    NEW.consignment_id, 'anchor.committed', 'lifecycle',
    NEW.id,
    NEW.anchor_type::text || ' anchored: ' || LEFT(NEW.root_hash, 16) || '...'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_anchor_committed
  AFTER INSERT ON anchors
  FOR EACH ROW
  EXECUTE FUNCTION log_anchor_event();

-- Trigger: receiver acknowledgment en handoff
CREATE OR REPLACE FUNCTION log_handoff_ack()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receiver_ack = true AND (OLD.receiver_ack IS DISTINCT FROM true) THEN
    INSERT INTO consignment_events (
      consignment_id, event_type, event_category,
      actor_id, ref_id, description
    ) VALUES (
      NEW.consignment_id, 'handoff.acknowledged', 'handoff',
      NEW.receiver_ack_by, NEW.id,
      'Receiver acknowledged handoff: ' || NEW.ho_type::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handoff_ack
  AFTER UPDATE ON consignment_handoffs
  FOR EACH ROW
  EXECUTE FUNCTION log_handoff_ack();

-- ============================================
-- 10. RPC: transition_consignment_state
-- ============================================

CREATE OR REPLACE FUNCTION transition_consignment_state(
  p_consignment_id UUID,
  p_to_state case_state,
  p_actor_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_evidence_refs UUID[] DEFAULT '{}'
)
RETURNS TABLE (
  transition_id UUID,
  from_state case_state,
  to_state case_state
) AS $$
DECLARE
  v_current case_state;
  v_transition_id UUID;
BEGIN
  -- Get current state
  SELECT current_state INTO v_current
  FROM consignment_cases
  WHERE id = p_consignment_id;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Consignment case not found: %', p_consignment_id;
  END IF;

  -- Validate: no self-transition
  IF v_current = p_to_state THEN
    RAISE EXCEPTION 'Already in state: %', p_to_state;
  END IF;

  -- Insert state transition (trigger updates consignment_cases.current_state)
  INSERT INTO state_transitions (
    consignment_id, from_state, to_state,
    actor_id, reason, evidence_refs
  ) VALUES (
    p_consignment_id, v_current, p_to_state,
    p_actor_id, p_reason, p_evidence_refs
  )
  RETURNING id INTO v_transition_id;

  RETURN QUERY SELECT v_transition_id, v_current, p_to_state;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION transition_consignment_state IS 'Transiciona formalmente el estado de una consignación con actor attribution';

-- ============================================
-- 11. RPC: compute_evidence_pack_hash
-- ============================================

CREATE OR REPLACE FUNCTION get_evidence_hashes_for_consignment(p_consignment_id UUID)
RETURNS TABLE (
  evidence_id UUID,
  content_hash VARCHAR,
  evidence_type evidence_type,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    eo.id,
    eo.content_hash,
    eo.evidence_type,
    eo.created_at
  FROM evidence_objects eo
  WHERE eo.consignment_id = p_consignment_id
  ORDER BY eo.created_at ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_evidence_hashes_for_consignment IS 'Obtiene todos los content_hashes de una consignación para construir el Merkle root off-chain';

-- ============================================
-- 12. RLS
-- ============================================

ALTER TABLE evidence_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchors ENABLE ROW LEVEL SECURITY;

-- evidence_objects: visible por participantes
CREATE POLICY "Evidence viewable by participants"
  ON evidence_objects FOR SELECT
  USING (
    created_by = auth.uid()
    OR (consignment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = evidence_objects.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    ))
  );

CREATE POLICY "Authenticated users can create evidence"
  ON evidence_objects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- NO UPDATE en evidence_objects (inmutable)
-- NO DELETE en evidence_objects (inmutable)

-- state_transitions: visible por participantes
CREATE POLICY "Transitions viewable by participants"
  ON state_transitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = state_transitions.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can create transitions"
  ON state_transitions FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- NO UPDATE, NO DELETE en state_transitions (append-only)

-- anchors: viewable by participants, insertable by system
CREATE POLICY "Anchors viewable by participants"
  ON anchors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consignment_cases cc
      WHERE cc.id = anchors.consignment_id
        AND (cc.exporter_id = auth.uid() OR cc.importer_id = auth.uid())
    )
  );

CREATE POLICY "System can create anchors"
  ON anchors FOR INSERT
  WITH CHECK (true);

-- NO UPDATE, NO DELETE en anchors (inmutable)

-- ============================================
-- FIN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Protocol Primitives created successfully';
  RAISE NOTICE 'New tables: evidence_objects, state_transitions, anchors';
  RAISE NOTICE 'Refined: consignment_cases (current_state, risk_status, shipment_window)';
  RAISE NOTICE 'Refined: consignment_attestations (claim_type, sig_method, supersession)';
  RAISE NOTICE 'Refined: consignment_handoffs (seal_refs, container_refs, receiver_ack)';
  RAISE NOTICE 'Refined: lots (harvest_window)';
  RAISE NOTICE 'New functions: transition_consignment_state, get_evidence_hashes_for_consignment';
  RAISE NOTICE 'New triggers: state transitions, evidence events, anchor commits, handoff acks';
  RAISE NOTICE 'Immutability enforced: evidence_objects, state_transitions, anchors';
END $$;
