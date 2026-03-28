/**
 * metricsService.ts
 * The 3 Hard Metrics — no vanity metrics.
 *
 * 1. Time to Evidence Pack
 *    Tiempo desde solicitud de revisión hasta pack listo.
 *    Baseline manual: horas. Target MVP: <30 min. Target serio: <10 min.
 *
 * 2. Time to Third-Party Verification
 *    Tiempo que tarda importador/auditor/underwriter en validar suficiencia.
 *    De revisión manual dispersa a validación en minutos.
 *
 * 3. Critical Uncertainty Reduction
 *    Porcentaje de consignaciones que llegan a decisión con cero blocking
 *    exceptions y evidencia crítica reconciliada.
 *    Sub-metrics: blocking_exception_rate, evidence_completeness_rate, custody_gap_rate
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  ServiceResult,
  TimeToEvidencePack,
  TimeToVerification,
  CriticalUncertaintyReduction,
} from "@/types/consignment.types";

export const metricsService = {

  // ============================================
  // METRIC 1: Time to Evidence Pack
  // ============================================

  /**
   * For a single consignment.
   */
  async getTimeToEvidencePack(consignmentId: string): Promise<ServiceResult<TimeToEvidencePack>> {
    try {
      const { data, error } = await supabase
        .from("consignment_cases")
        .select("pack_requested_at, pack_generated_at")
        .eq("id", consignmentId)
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || "Not found" };
      }

      const requested = (data as any).pack_requested_at;
      const generated = (data as any).pack_generated_at;
      let duration: number | null = null;

      if (requested && generated) {
        duration = (new Date(generated).getTime() - new Date(requested).getTime()) / (1000 * 60);
      }

      return {
        success: true,
        data: {
          pack_requested_at: requested,
          pack_generated_at: generated,
          duration_minutes: duration !== null ? Math.round(duration * 100) / 100 : null,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Aggregate across all consignments for a given exporter.
   */
  async getAverageTimeToEvidencePack(
    exporterId?: string
  ): Promise<ServiceResult<{ avg_minutes: number; median_minutes: number; count: number; under_30min: number; under_10min: number }>> {
    try {
      let query = supabase
        .from("consignment_cases")
        .select("pack_requested_at, pack_generated_at")
        .not("pack_requested_at", "is", null)
        .not("pack_generated_at", "is", null);

      if (exporterId) {
        query = query.eq("exporter_id", exporterId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const durations = (data || [])
        .map((row: any) => {
          const req = new Date(row.pack_requested_at).getTime();
          const gen = new Date(row.pack_generated_at).getTime();
          return (gen - req) / (1000 * 60);
        })
        .filter((d: number) => d >= 0)
        .sort((a: number, b: number) => a - b);

      if (durations.length === 0) {
        return { success: true, data: { avg_minutes: 0, median_minutes: 0, count: 0, under_30min: 0, under_10min: 0 } };
      }

      const avg = durations.reduce((s: number, d: number) => s + d, 0) / durations.length;
      const median = durations[Math.floor(durations.length / 2)];
      const under30 = durations.filter((d: number) => d <= 30).length;
      const under10 = durations.filter((d: number) => d <= 10).length;

      return {
        success: true,
        data: {
          avg_minutes: Math.round(avg * 100) / 100,
          median_minutes: Math.round(median * 100) / 100,
          count: durations.length,
          under_30min: under30,
          under_10min: under10,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // METRIC 2: Time to Third-Party Verification
  // ============================================

  /**
   * For a single consignment.
   */
  async getTimeToVerification(consignmentId: string): Promise<ServiceResult<TimeToVerification>> {
    try {
      const { data, error } = await supabase
        .from("consignment_cases")
        .select("verification_requested_at, verification_completed_at")
        .eq("id", consignmentId)
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || "Not found" };
      }

      const requested = (data as any).verification_requested_at;
      const completed = (data as any).verification_completed_at;
      let duration: number | null = null;

      if (requested && completed) {
        duration = (new Date(completed).getTime() - new Date(requested).getTime()) / (1000 * 60);
      }

      return {
        success: true,
        data: {
          verification_requested_at: requested,
          verification_completed_at: completed,
          duration_minutes: duration !== null ? Math.round(duration * 100) / 100 : null,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Aggregate across all consignments.
   */
  async getAverageTimeToVerification(
    exporterId?: string
  ): Promise<ServiceResult<{ avg_minutes: number; median_minutes: number; count: number }>> {
    try {
      let query = supabase
        .from("consignment_cases")
        .select("verification_requested_at, verification_completed_at")
        .not("verification_requested_at", "is", null)
        .not("verification_completed_at", "is", null);

      if (exporterId) {
        query = query.eq("exporter_id", exporterId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const durations = (data || [])
        .map((row: any) => {
          const req = new Date(row.verification_requested_at).getTime();
          const comp = new Date(row.verification_completed_at).getTime();
          return (comp - req) / (1000 * 60);
        })
        .filter((d: number) => d >= 0)
        .sort((a: number, b: number) => a - b);

      if (durations.length === 0) {
        return { success: true, data: { avg_minutes: 0, median_minutes: 0, count: 0 } };
      }

      const avg = durations.reduce((s: number, d: number) => s + d, 0) / durations.length;
      const median = durations[Math.floor(durations.length / 2)];

      return {
        success: true,
        data: {
          avg_minutes: Math.round(avg * 100) / 100,
          median_minutes: Math.round(median * 100) / 100,
          count: durations.length,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // METRIC 3: Critical Uncertainty Reduction
  // ============================================

  /**
   * Across all consignments (or filtered by exporter).
   *
   * Defined as: porcentaje de consignaciones que llegan a decisión
   * con cero blocking exceptions y evidencia crítica reconciliada.
   *
   * Sub-metrics:
   *   - blocking_exception_rate: % of consignments with ≥1 blocking exception
   *   - evidence_completeness_rate: avg evidence_completeness_pct
   *   - custody_gap_rate: % of consignments with ≥1 custody gap
   */
  async getCriticalUncertaintyReduction(
    exporterId?: string
  ): Promise<ServiceResult<CriticalUncertaintyReduction>> {
    try {
      let query = supabase
        .from("consignment_cases")
        .select("id, blocking_exception_count, evidence_completeness_pct, custody_gap_count");

      if (exporterId) {
        query = query.eq("exporter_id", exporterId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const cases = data || [];
      const total = cases.length;

      if (total === 0) {
        return {
          success: true,
          data: {
            blocking_exception_rate: 0,
            evidence_completeness_rate: 0,
            custody_gap_rate: 0,
            consignments_with_zero_blockers: 0,
            total_consignments: 0,
            uncertainty_reduction_pct: 0,
          },
        };
      }

      const withBlockers = cases.filter(
        (c: any) => (c.blocking_exception_count || 0) > 0
      ).length;

      const avgCompleteness =
        cases.reduce((sum: number, c: any) => sum + (c.evidence_completeness_pct || 0), 0) / total;

      const withGaps = cases.filter(
        (c: any) => (c.custody_gap_count || 0) > 0
      ).length;

      const zeroBlockers = total - withBlockers;

      // Uncertainty reduction = % of cases that are "clean"
      // (zero blockers AND completeness >= 80% AND zero gaps)
      const clean = cases.filter(
        (c: any) =>
          (c.blocking_exception_count || 0) === 0 &&
          (c.evidence_completeness_pct || 0) >= 80 &&
          (c.custody_gap_count || 0) === 0
      ).length;

      return {
        success: true,
        data: {
          blocking_exception_rate: Math.round((withBlockers / total) * 10000) / 100,
          evidence_completeness_rate: Math.round(avgCompleteness * 100) / 100,
          custody_gap_rate: Math.round((withGaps / total) * 10000) / 100,
          consignments_with_zero_blockers: zeroBlockers,
          total_consignments: total,
          uncertainty_reduction_pct: Math.round((clean / total) * 10000) / 100,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // DASHBOARD AGGREGATE (all 3 metrics)
  // ============================================

  async getMetricsDashboard(exporterId?: string): Promise<ServiceResult<{
    time_to_pack: { avg_minutes: number; median_minutes: number; count: number; under_30min: number; under_10min: number };
    time_to_verify: { avg_minutes: number; median_minutes: number; count: number };
    uncertainty: CriticalUncertaintyReduction;
  }>> {
    try {
      const [packResult, verifyResult, uncertaintyResult] = await Promise.all([
        this.getAverageTimeToEvidencePack(exporterId),
        this.getAverageTimeToVerification(exporterId),
        this.getCriticalUncertaintyReduction(exporterId),
      ]);

      return {
        success: true,
        data: {
          time_to_pack: packResult.success ? packResult.data! : { avg_minutes: 0, median_minutes: 0, count: 0, under_30min: 0, under_10min: 0 },
          time_to_verify: verifyResult.success ? verifyResult.data! : { avg_minutes: 0, median_minutes: 0, count: 0 },
          uncertainty: uncertaintyResult.success ? uncertaintyResult.data! : {
            blocking_exception_rate: 0, evidence_completeness_rate: 0, custody_gap_rate: 0,
            consignments_with_zero_blockers: 0, total_consignments: 0, uncertainty_reduction_pct: 0,
          },
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
};
