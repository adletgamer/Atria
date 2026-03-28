/**
 * financingService.ts
 * Demo 2: Financing / Underwriting Readiness
 *
 * Pregunta que responde:
 *   "¿Es esta consignación suficientemente verificable para adelanto,
 *    cobertura o underwriting?"
 *
 * Superficie:
 *   - evidence sufficiency score
 *   - custody continuity score
 *   - unresolved exception count
 *   - recency of critical documents
 *   - financing eligibility flag
 *   - pack export for underwriter
 */

import { supabase } from "@/integrations/supabase/client";
import { complianceService } from "./complianceService";
import type {
  ServiceResult,
  FinancingReadiness,
} from "@/types/consignment.types";

const CRITICAL_DOC_TYPES = [
  "phytosanitary_cert",
  "certificate_of_origin",
  "bill_of_lading",
  "commercial_invoice",
  "insurance_cert",
];

// Thresholds for financing eligibility
const THRESHOLDS = {
  MIN_EVIDENCE_SCORE: 70,
  MIN_CUSTODY_SCORE: 60,
  MAX_UNRESOLVED_EXCEPTIONS: 0,
  MAX_DOC_AGE_DAYS: 90,
};

export const financingService = {

  /**
   * Full financing readiness assessment.
   */
  async getFinancingReadiness(consignmentId: string): Promise<ServiceResult<FinancingReadiness>> {
    try {
      // 1. Get case info
      const { data: caseData, error: caseError } = await supabase
        .from("consignment_cases")
        .select("case_number")
        .eq("id", consignmentId)
        .single();

      if (caseError || !caseData) {
        return { success: false, error: caseError?.message || "Consignment not found" };
      }

      // 2. Get compliance data (reuse, not duplicate)
      const [completenessResult, continuityResult, exceptionsResult, recencyResult] =
        await Promise.all([
          complianceService.getEvidenceCompleteness(consignmentId),
          complianceService.getCustodyContinuity(consignmentId),
          this.getUnresolvedExceptionCount(consignmentId),
          this.getCriticalDocRecency(consignmentId),
        ]);

      const evidenceScore = completenessResult.success
        ? completenessResult.data!.completeness_pct
        : 0;

      const custodyScore = continuityResult.success
        ? continuityResult.data!.continuity_score
        : 0;

      const unresolvedCount = exceptionsResult.success
        ? exceptionsResult.data!
        : 999;

      const docRecency = recencyResult.success
        ? recencyResult.data!
        : {};

      // 3. Evaluate eligibility
      const eligibilityReasons: string[] = [];
      const disqualifiers: string[] = [];

      if (evidenceScore >= THRESHOLDS.MIN_EVIDENCE_SCORE) {
        eligibilityReasons.push(`Evidence sufficiency ${evidenceScore}% >= ${THRESHOLDS.MIN_EVIDENCE_SCORE}% threshold`);
      } else {
        disqualifiers.push(`Evidence sufficiency ${evidenceScore}% < ${THRESHOLDS.MIN_EVIDENCE_SCORE}% threshold`);
      }

      if (custodyScore >= THRESHOLDS.MIN_CUSTODY_SCORE) {
        eligibilityReasons.push(`Custody continuity ${custodyScore}% >= ${THRESHOLDS.MIN_CUSTODY_SCORE}% threshold`);
      } else {
        disqualifiers.push(`Custody continuity ${custodyScore}% < ${THRESHOLDS.MIN_CUSTODY_SCORE}% threshold`);
      }

      if (unresolvedCount <= THRESHOLDS.MAX_UNRESOLVED_EXCEPTIONS) {
        eligibilityReasons.push("Zero unresolved blocking exceptions");
      } else {
        disqualifiers.push(`${unresolvedCount} unresolved blocking exception(s)`);
      }

      // Check doc recency
      const now = new Date();
      for (const [docType, dateStr] of Object.entries(docRecency)) {
        if (!dateStr) {
          disqualifiers.push(`Missing critical document: ${docType}`);
          continue;
        }
        const docDate = new Date(dateStr as string);
        const ageDays = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > THRESHOLDS.MAX_DOC_AGE_DAYS) {
          disqualifiers.push(`${docType} is ${Math.round(ageDays)} days old (max ${THRESHOLDS.MAX_DOC_AGE_DAYS})`);
        }
      }

      const eligible = disqualifiers.length === 0;

      const readiness: FinancingReadiness = {
        consignment_id: consignmentId,
        case_number: (caseData as any).case_number,
        evidence_sufficiency_score: evidenceScore,
        custody_continuity_score: custodyScore,
        unresolved_exception_count: unresolvedCount,
        critical_doc_recency: docRecency,
        financing_eligible: eligible,
        eligibility_reasons: eligibilityReasons,
        disqualifiers,
      };

      return { success: true, data: readiness };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Count of unresolved blocking exceptions.
   */
  async getUnresolvedExceptionCount(consignmentId: string): Promise<ServiceResult<number>> {
    try {
      const { count, error } = await supabase
        .from("consignment_exceptions")
        .select("*", { count: "exact", head: true })
        .eq("consignment_id", consignmentId)
        .eq("resolved", false)
        .eq("blocks_readiness", true);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: count || 0 };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Most recent date of each critical document type.
   * Returns null for missing types.
   */
  async getCriticalDocRecency(
    consignmentId: string
  ): Promise<ServiceResult<Record<string, string | null>>> {
    try {
      const { data, error } = await supabase
        .from("consignment_documents")
        .select("doc_type, created_at, issued_at")
        .eq("consignment_id", consignmentId)
        .in("doc_type", CRITICAL_DOC_TYPES as any)
        .order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const recency: Record<string, string | null> = {};
      for (const docType of CRITICAL_DOC_TYPES) {
        const doc = (data || []).find((d: any) => d.doc_type === docType);
        recency[docType] = doc
          ? (doc as any).issued_at || (doc as any).created_at
          : null;
      }

      return { success: true, data: recency };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Mark a consignment as verification-requested by a third party (importer/underwriter).
   */
  async requestVerification(consignmentId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from("consignment_cases")
        .update({ verification_requested_at: new Date().toISOString() })
        .eq("id", consignmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Mark verification as completed by third party.
   */
  async completeVerification(consignmentId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from("consignment_cases")
        .update({ verification_completed_at: new Date().toISOString() })
        .eq("id", consignmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
};
