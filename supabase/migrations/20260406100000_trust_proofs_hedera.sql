-- ============================================================================
-- FASE 3: TRUST PROOFS — Hedera HCS Anchoring Layer
-- ============================================================================
-- Immutable audit trail linking Evidence Packs to Hedera consensus timestamps.
-- Stores ONLY hashes + Hedera metadata. Never raw data.
-- ============================================================================

-- ============================================================================
-- 1. ANCHOR STATUS ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE anchor_status AS ENUM (
    'pending',           -- Hash computed, not yet submitted to Hedera
    'pending_anchor',    -- Submitted to Hedera, awaiting confirmation
    'anchored',          -- Confirmed on Hedera with consensus timestamp
    'failed',            -- Hedera submission failed (will retry)
    'verified'           -- Externally verified via mirror node
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. TRUST_PROOFS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS trust_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to consignment
  consignment_id UUID NOT NULL REFERENCES consignment_cases(id) ON DELETE RESTRICT,
  
  -- What was anchored
  pack_hash TEXT NOT NULL,                          -- SHA-256 of the Evidence Pack JSON
  pack_version INTEGER NOT NULL DEFAULT 1,          -- Evidence Pack version (monotonic)
  input_hashes TEXT[] NOT NULL DEFAULT '{}',         -- Individual evidence hashes that compose the pack
  evidence_count INTEGER NOT NULL DEFAULT 0,
  attestation_count INTEGER NOT NULL DEFAULT 0,
  
  -- Hedera HCS metadata
  topic_id TEXT,                                     -- Hedera Topic ID (e.g. 0.0.12345)
  sequence_number BIGINT,                            -- HCS message sequence number (unique per topic)
  consensus_timestamp TEXT,                          -- Hedera consensus timestamp (e.g. 1234567890.123456789)
  transaction_id TEXT,                               -- Hedera transaction ID (e.g. 0.0.12345@1234567890.123)
  running_hash TEXT,                                 -- Topic running hash at this sequence number
  
  -- Status and metadata
  status anchor_status NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  
  -- Message payload (what was sent to Hedera — hash + metadata, never raw data)
  message_payload JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  hash_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When hash was computed
  submitted_at TIMESTAMPTZ,                              -- When submitted to Hedera
  anchored_at TIMESTAMPTZ,                               -- Hedera consensus timestamp (parsed)
  verified_at TIMESTAMPTZ,                               -- When externally verified
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_consignment_version UNIQUE (consignment_id, pack_version),
  CONSTRAINT positive_version CHECK (pack_version > 0),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0)
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX idx_trust_proofs_consignment_id ON trust_proofs(consignment_id);
CREATE INDEX idx_trust_proofs_status ON trust_proofs(status);
CREATE INDEX idx_trust_proofs_pack_hash ON trust_proofs(pack_hash);
CREATE INDEX idx_trust_proofs_topic_sequence ON trust_proofs(topic_id, sequence_number);
CREATE INDEX idx_trust_proofs_pending ON trust_proofs(status) WHERE status IN ('pending', 'pending_anchor', 'failed');

-- ============================================================================
-- 4. RLS
-- ============================================================================

ALTER TABLE trust_proofs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view trust proofs (public audit trail)
CREATE POLICY "Authenticated users can view trust proofs"
ON trust_proofs FOR SELECT
TO authenticated
USING (true);

-- Only compliance_lead and system_admin can create proofs
CREATE POLICY "Compliance leads can create trust proofs"
ON trust_proofs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('compliance_lead', 'system_admin')
      AND is_active = true
  )
);

-- Only system can update proofs (status changes from anchoring process)
CREATE POLICY "System can update trust proofs"
ON trust_proofs FOR UPDATE
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('compliance_lead', 'system_admin')
      AND is_active = true
  )
);

-- Never delete trust proofs (immutable audit trail)
-- No DELETE policy = no deletes allowed

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Get latest trust proof for a consignment
CREATE OR REPLACE FUNCTION get_latest_trust_proof(p_consignment_id UUID)
RETURNS trust_proofs AS $$
  SELECT * FROM trust_proofs
  WHERE consignment_id = p_consignment_id
  ORDER BY pack_version DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Check if a consignment has been anchored
CREATE OR REPLACE FUNCTION is_consignment_anchored(p_consignment_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM trust_proofs
    WHERE consignment_id = p_consignment_id
      AND status = 'anchored'
  );
$$ LANGUAGE SQL STABLE;

-- Prevent anchoring same hash+version twice (idempotency guard)
CREATE OR REPLACE FUNCTION check_duplicate_anchor()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS(
    SELECT 1 FROM trust_proofs
    WHERE consignment_id = NEW.consignment_id
      AND pack_version = NEW.pack_version
      AND status IN ('anchored', 'verified')
  ) THEN
    RAISE EXCEPTION 'Consignment % version % is already anchored. Cannot anchor the same version twice.',
      NEW.consignment_id, NEW.pack_version;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_anchor
BEFORE INSERT ON trust_proofs
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_anchor();

-- ============================================================================
-- 6. ADD pack_status TRACKING TO consignment_cases (if not exists)
-- ============================================================================

-- Add anchor_status column to consignment_cases for quick lookups
ALTER TABLE consignment_cases 
ADD COLUMN IF NOT EXISTS anchor_status anchor_status DEFAULT 'pending';

ALTER TABLE consignment_cases
ADD COLUMN IF NOT EXISTS last_anchor_tx TEXT;

ALTER TABLE consignment_cases
ADD COLUMN IF NOT EXISTS last_anchor_at TIMESTAMPTZ;

-- ============================================================================
-- 7. AUTO-UPDATE consignment_cases ON ANCHOR
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_consignment_anchor_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'anchored' THEN
    UPDATE consignment_cases
    SET 
      anchor_status = 'anchored',
      last_anchor_tx = NEW.transaction_id,
      last_anchor_at = NEW.anchored_at
    WHERE id = NEW.consignment_id;
  ELSIF NEW.status = 'pending_anchor' THEN
    UPDATE consignment_cases
    SET anchor_status = 'pending_anchor'
    WHERE id = NEW.consignment_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE consignment_cases
    SET anchor_status = 'failed'
    WHERE id = NEW.consignment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_anchor_status_trigger
AFTER INSERT OR UPDATE OF status ON trust_proofs
FOR EACH ROW
EXECUTE FUNCTION sync_consignment_anchor_status();

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE trust_proofs IS 
  'Immutable audit trail linking Evidence Packs to Hedera HCS consensus timestamps. Never stores raw data — only hashes.';
COMMENT ON COLUMN trust_proofs.pack_hash IS 
  'SHA-256 hash of the serialized Evidence Pack JSON. This is what gets anchored to Hedera.';
COMMENT ON COLUMN trust_proofs.sequence_number IS 
  'Hedera HCS message sequence number — unique, monotonically increasing per topic.';
COMMENT ON COLUMN trust_proofs.consensus_timestamp IS 
  'Hedera network consensus timestamp — neutral, non-manipulable.';
COMMENT ON COLUMN trust_proofs.running_hash IS 
  'Running hash of the Hedera topic at this sequence number — proves message ordering.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'trust_proofs') = 1,
    'trust_proofs table not created';
  RAISE NOTICE 'Fase 3: trust_proofs migration completed successfully';
END $$;
