-- ============================================
-- MIGRATION: Pack Status + Evidence Freshness
-- ============================================
-- Date: 2026-03-31
-- Purpose:
--   1. Add pack_status enum and column to consignment_cases
--   2. Add expires_at and freshness_window_days to evidence_objects
--   3. Add function to compute pack_status
--   4. Update pack_status on relevant events

-- ============================================
-- 1. PACK STATUS ENUM
-- ============================================

DO $$ BEGIN
  CREATE TYPE pack_status AS ENUM (
    'not_generated',
    'stale',
    'fresh',
    'anchored',
    'shared'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE pack_status IS 'Lifecycle state of the evidence pack: not_generated → fresh → stale | anchored → shared';

ALTER TABLE consignment_cases
  ADD COLUMN IF NOT EXISTS pack_status pack_status NOT NULL DEFAULT 'not_generated';

-- ============================================
-- 2. EVIDENCE FRESHNESS FIELDS
-- ============================================

ALTER TABLE evidence_objects
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS freshness_window_days INTEGER DEFAULT NULL;

COMMENT ON COLUMN evidence_objects.expires_at IS 'When this evidence expires (e.g. certificate validity end date)';
COMMENT ON COLUMN evidence_objects.freshness_window_days IS 'Days before expiry to flag as expiring-soon (default 30 if null)';

-- ============================================
-- 3. COMPUTE PACK STATUS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION compute_pack_status(p_consignment_id UUID)
RETURNS pack_status AS $$
DECLARE
  v_anchor_exists BOOLEAN;
  v_anchor_has_tx BOOLEAN;
  v_snapshot_exists BOOLEAN;
  v_latest_snapshot_at TIMESTAMPTZ;
  v_latest_evidence_at TIMESTAMPTZ;
  v_latest_exception_at TIMESTAMPTZ;
BEGIN
  -- Check if any anchor exists for this consignment
  SELECT EXISTS(
    SELECT 1 FROM anchors WHERE consignment_id = p_consignment_id
  ) INTO v_anchor_exists;

  SELECT EXISTS(
    SELECT 1 FROM anchors WHERE consignment_id = p_consignment_id AND chain_tx IS NOT NULL
  ) INTO v_anchor_has_tx;

  -- If anchored on-chain, it's anchored (or shared if we add sharing later)
  IF v_anchor_has_tx THEN
    RETURN 'anchored';
  END IF;

  -- Check latest snapshot
  SELECT MAX(created_at) INTO v_latest_snapshot_at
  FROM state_snapshots WHERE consignment_id = p_consignment_id;

  IF v_latest_snapshot_at IS NULL THEN
    RETURN 'not_generated';
  END IF;

  -- Check if any evidence or exception changed after the snapshot
  SELECT MAX(created_at) INTO v_latest_evidence_at
  FROM evidence_objects WHERE consignment_id = p_consignment_id;

  SELECT MAX(GREATEST(raised_at, COALESCE(resolved_at, '1970-01-01'))) INTO v_latest_exception_at
  FROM consignment_exceptions WHERE consignment_id = p_consignment_id;

  -- If evidence or exceptions are newer than snapshot, pack is stale
  IF v_latest_evidence_at > v_latest_snapshot_at OR v_latest_exception_at > v_latest_snapshot_at THEN
    RETURN 'stale';
  END IF;

  RETURN 'fresh';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGER: Update pack_status after snapshot creation
-- ============================================

CREATE OR REPLACE FUNCTION update_pack_status_on_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE consignment_cases
  SET pack_status = compute_pack_status(NEW.consignment_id)
  WHERE id = NEW.consignment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_pack_status_on_snapshot ON state_snapshots;
CREATE TRIGGER trg_update_pack_status_on_snapshot
  AFTER INSERT ON state_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_pack_status_on_snapshot();

-- ============================================
-- 5. TRIGGER: Mark pack stale when evidence changes
-- ============================================

CREATE OR REPLACE FUNCTION mark_pack_stale_on_evidence_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consignment_id IS NOT NULL THEN
    UPDATE consignment_cases
    SET pack_status = 'stale'
    WHERE id = NEW.consignment_id
      AND pack_status IN ('fresh', 'anchored');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mark_pack_stale_on_evidence ON evidence_objects;
CREATE TRIGGER trg_mark_pack_stale_on_evidence
  AFTER INSERT OR UPDATE ON evidence_objects
  FOR EACH ROW
  EXECUTE FUNCTION mark_pack_stale_on_evidence_change();

-- ============================================
-- 6. TRIGGER: Mark pack stale when exceptions change
-- ============================================

CREATE OR REPLACE FUNCTION mark_pack_stale_on_exception_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE consignment_cases
  SET pack_status = 'stale'
  WHERE id = NEW.consignment_id
    AND pack_status IN ('fresh', 'anchored');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mark_pack_stale_on_exception ON consignment_exceptions;
CREATE TRIGGER trg_mark_pack_stale_on_exception
  AFTER INSERT OR UPDATE ON consignment_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION mark_pack_stale_on_exception_change();

-- ============================================
-- 7. Update pack_status to anchored when anchor gets chain_tx
-- ============================================

CREATE OR REPLACE FUNCTION update_pack_status_on_anchor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chain_tx IS NOT NULL AND (OLD.chain_tx IS NULL OR OLD.chain_tx != NEW.chain_tx) THEN
    UPDATE consignment_cases
    SET pack_status = 'anchored'
    WHERE id = NEW.consignment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_pack_status_on_anchor ON anchors;
CREATE TRIGGER trg_update_pack_status_on_anchor
  AFTER INSERT OR UPDATE ON anchors
  FOR EACH ROW
  EXECUTE FUNCTION update_pack_status_on_anchor();

-- ============================================
-- FIN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Pack status + evidence freshness migration complete';
  RAISE NOTICE 'New enum: pack_status (not_generated, stale, fresh, anchored, shared)';
  RAISE NOTICE 'New columns: consignment_cases.pack_status, evidence_objects.expires_at, evidence_objects.freshness_window_days';
  RAISE NOTICE 'New function: compute_pack_status';
  RAISE NOTICE 'New triggers: pack_status auto-updates on snapshot, evidence, exception, anchor changes';
END $$;
