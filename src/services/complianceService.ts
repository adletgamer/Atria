/**
 * complianceService.ts
 * Demo 1: Compliance / Import Readiness
 *
 * Pregunta que responde:
 *   "¿Esta consignación está lista para ser defendida y aceptada?"
 *
 * Superficie:
 *   - current state
 *   - blocking exceptions
 *   - evidence completeness
 *   - attestations present/missing
 *   - custody continuity
 *   - generate evidence pack
 *   - verify hash / anchor
 */

import { supabase } from "@/integrations/supabase/client";
import { evidenceService } from "./evidenceService";
import { anchorService } from "./anchorService";
import type {
  ServiceResult,
  ComplianceReadiness,
  EvidenceCompleteness,
  CustodyContinuity,
  ConsignmentException,
  Anchor,
  StateSnapshot,
  CaseState,
} from "@/types/consignment.types";

const REQUIRED_ATTESTATION_TYPES = [
  "quality_confirmed",
  "docs_complete",
  "inspection_passed",
  "phyto_cleared",
  "export_cleared",
  "import_cleared",
];

export const complianceService = {

  /**
   * Full compliance readiness assessment for a consignment.
   * This is the primary demo view.
   */
  async getComplianceReadiness(consignmentId: string): Promise<ServiceResult<ComplianceReadiness>> {
    try {
      // 1. Get case
      const { data: caseData, error: caseError } = await supabase
        .from("consignment_cases")
        .select("case_number, current_state, status, readiness")
        .eq("id", consignmentId)
        .single();

      if (caseError || !caseData) {
        return { success: false, error: caseError?.message || "Consignment not found" };
      }

      // 2. Parallel fetches
      const [
        completenessResult,
        continuityResult,
        blockingExcResult,
        attestationsResult,
        lastAnchorResult,
        lastSnapshotResult,
      ] = await Promise.all([
        this.getEvidenceCompleteness(consignmentId),
        this.getCustodyContinuity(consignmentId),
        this.getBlockingExceptions(consignmentId),
        this.getAttestationStatus(consignmentId),
        anchorService.getLatestAnchor(consignmentId, "evidence_pack"),
        this.getLatestSnapshot(consignmentId),
      ]);

      const completeness = completenessResult.success ? completenessResult.data! : {
        total_required: 0, total_present: 0, total_verified: 0,
        completeness_pct: 0, missing_critical: [],
      };

      const continuity = continuityResult.success ? continuityResult.data! : {
        total_handoffs: 0, signed_handoffs: 0, dual_signed: 0,
        witnessed: 0, unsigned_handoffs: 0, custody_gaps: 0, continuity_score: 0,
      };

      const blockingExceptions = blockingExcResult.success ? blockingExcResult.data! : [];
      const attestations = attestationsResult.success ? attestationsResult.data! : { present: [], missing: REQUIRED_ATTESTATION_TYPES };
      const lastAnchor = lastAnchorResult.success ? lastAnchorResult.data! : null;
      const lastSnapshot = lastSnapshotResult.success ? lastSnapshotResult.data! : null;

      // Can generate pack?
      const canGeneratePack =
        completeness.completeness_pct >= 80 &&
        blockingExceptions.length === 0 &&
        continuity.custody_gaps === 0;

      const readiness: ComplianceReadiness = {
        consignment_id: consignmentId,
        case_number: (caseData as any).case_number,
        current_state: (caseData as any).current_state as CaseState,
        blocking_exceptions: blockingExceptions,
        evidence_completeness: completeness,
        attestations_present: attestations.present,
        attestations_missing: attestations.missing,
        custody_continuity: continuity,
        can_generate_pack: canGeneratePack,
        last_anchor: lastAnchor,
        last_snapshot: lastSnapshot,
      };

      return { success: true, data: readiness };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Evidence completeness via DB function.
   */
  async getEvidenceCompleteness(consignmentId: string): Promise<ServiceResult<EvidenceCompleteness>> {
    try {
      const { data, error } = await supabase
        .rpc("compute_evidence_completeness", {
          p_consignment_id: consignmentId,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        return { success: false, error: "No completeness data returned" };
      }

      return {
        success: true,
        data: {
          total_required: row.total_required,
          total_present: row.total_present,
          total_verified: row.total_verified,
          completeness_pct: row.completeness_pct,
          missing_critical: row.missing_critical || [],
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Custody continuity via DB function.
   */
  async getCustodyContinuity(consignmentId: string): Promise<ServiceResult<CustodyContinuity>> {
    try {
      const { data, error } = await supabase
        .rpc("compute_custody_continuity", {
          p_consignment_id: consignmentId,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        return { success: false, error: "No continuity data returned" };
      }

      return {
        success: true,
        data: {
          total_handoffs: row.total_handoffs,
          signed_handoffs: row.signed_handoffs,
          dual_signed: row.dual_signed,
          witnessed: row.witnessed,
          unsigned_handoffs: row.unsigned_handoffs,
          custody_gaps: row.custody_gaps,
          continuity_score: row.continuity_score,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Blocking exceptions only.
   */
  async getBlockingExceptions(consignmentId: string): Promise<ServiceResult<ConsignmentException[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_exceptions")
        .select("*")
        .eq("consignment_id", consignmentId)
        .eq("resolved", false)
        .eq("blocks_readiness", true)
        .order("raised_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as unknown as ConsignmentException[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Attestation presence check against required types.
   */
  async getAttestationStatus(
    consignmentId: string
  ): Promise<ServiceResult<{ present: string[]; missing: string[] }>> {
    try {
      const { data, error } = await supabase
        .from("consignment_attestations")
        .select("att_type")
        .eq("consignment_id", consignmentId)
        .eq("revoked", false);

      if (error) {
        return { success: false, error: error.message };
      }

      const presentTypes = [...new Set((data || []).map((a: any) => a.att_type))];
      const missing = REQUIRED_ATTESTATION_TYPES.filter(
        (t) => !presentTypes.includes(t)
      );

      return { success: true, data: { present: presentTypes, missing } };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Latest state snapshot.
   */
  async getLatestSnapshot(consignmentId: string): Promise<ServiceResult<StateSnapshot | null>> {
    try {
      const { data, error } = await supabase
        .from("state_snapshots")
        .select("*")
        .eq("consignment_id", consignmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as unknown as StateSnapshot | null };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Full compliance flow: assess → snapshot → pack → anchor.
   * Returns evidence pack + anchor if wallet connected.
   */
  async generateCompliancePack(
    consignmentId: string,
    requestedBy: string,
    contractAddress?: string,
    chainId?: number
  ): Promise<ServiceResult<{ readiness: ComplianceReadiness; pack_hash: string; anchor_tx: string | null }>> {
    try {
      // 1. Mark pack requested
      await supabase
        .from("consignment_cases")
        .update({ pack_requested_at: new Date().toISOString() })
        .eq("id", consignmentId);

      // 2. Create state snapshot
      await supabase.rpc("create_state_snapshot", {
        p_consignment_id: consignmentId,
        p_trigger: "evidence_pack_request",
        p_triggered_by: requestedBy,
      });

      // 3. Get readiness assessment
      const readinessResult = await this.getComplianceReadiness(consignmentId);
      if (!readinessResult.success || !readinessResult.data) {
        return { success: false, error: readinessResult.error || "Assessment failed" };
      }

      // 4. Generate evidence pack
      const packResult = await evidenceService.generateEvidencePack(consignmentId);
      if (!packResult.success || !packResult.data) {
        return { success: false, error: packResult.error || "Pack generation failed" };
      }

      // 5. Mark pack generated
      await supabase
        .from("consignment_cases")
        .update({ pack_generated_at: new Date().toISOString() })
        .eq("id", consignmentId);

      // 6. Anchor on-chain if contract available
      let anchorTx: string | null = null;
      if (contractAddress && chainId) {
        const anchorResult = await anchorService.anchorEvidencePack(
          consignmentId,
          contractAddress,
          chainId
        );
        if (anchorResult.success && anchorResult.data) {
          anchorTx = anchorResult.data.chainTx;
        }
      }

      return {
        success: true,
        data: {
          readiness: readinessResult.data,
          pack_hash: packResult.data.root_hash,
          anchor_tx: anchorTx,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
};
