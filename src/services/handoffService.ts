/**
 * handoffService.ts
 * Gestión de transferencias de custodia y excepciones de consignaciones.
 * 
 * Handoffs = transferencias físicas de custodia entre partes
 * Exceptions = problemas, holds, claims que bloquean o afectan readiness
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type {
  ServiceResult,
  ConsignmentHandoff,
  ConsignmentException,
  LogHandoffPayload,
  RaiseExceptionPayload,
  ResolveExceptionPayload,
} from "@/types/consignment.types";

export const handoffService = {

  // ============================================
  // HANDOFFS (CUSTODIA)
  // ============================================

  async logHandoff(payload: LogHandoffPayload): Promise<ServiceResult<ConsignmentHandoff>> {
    try {
      if (!payload.consignment_id || !payload.ho_type) {
        return { success: false, error: "consignment_id y ho_type son requeridos" };
      }

      const { data, error } = await supabase
        .from("consignment_handoffs")
        .insert({
          consignment_id: payload.consignment_id,
          from_party_id: payload.from_party_id || null,
          to_party_id: payload.to_party_id || null,
          ho_type: payload.ho_type,
          location: payload.location || null,
          occurred_at: payload.occurred_at || new Date().toISOString(),
          condition_notes: payload.condition_notes || null,
          temperature_c: payload.temperature_c || null,
          evidence_refs: payload.evidence_refs || [],
          seal_refs: (payload as any).seal_refs || null,
          container_refs: (payload as any).container_refs || null,
        })
        .select()
        .single();

      if (error) {
        logger.error("handoff.log_failed", {}, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ConsignmentHandoff };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getCaseHandoffs(consignmentId: string): Promise<ServiceResult<ConsignmentHandoff[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_handoffs")
        .select(`
          *,
          from_party:from_party_id (full_name),
          to_party:to_party_id (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .order("occurred_at", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentHandoff[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getLatestHandoff(consignmentId: string): Promise<ServiceResult<ConsignmentHandoff | null>> {
    try {
      const { data, error } = await supabase
        .from("consignment_handoffs")
        .select(`
          *,
          from_party:from_party_id (full_name),
          to_party:to_party_id (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ConsignmentHandoff | null };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Receiver acknowledges a custody handoff.
   * Triggers auto-event via DB trigger.
   */
  async acknowledgeHandoff(
    handoffId: string,
    acknowledgedBy: string
  ): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from("consignment_handoffs")
        .update({
          receiver_ack: true,
          receiver_ack_at: new Date().toISOString(),
          receiver_ack_by: acknowledgedBy,
        })
        .eq("id", handoffId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // EXCEPTIONS (PROBLEMAS / HOLDS / CLAIMS)
  // ============================================

  async raiseException(payload: RaiseExceptionPayload): Promise<ServiceResult<ConsignmentException>> {
    try {
      if (!payload.consignment_id || !payload.exc_type || !payload.title || !payload.raised_by) {
        return { success: false, error: "consignment_id, exc_type, title y raised_by son requeridos" };
      }

      const { data, error } = await supabase
        .from("consignment_exceptions")
        .insert({
          consignment_id: payload.consignment_id,
          exc_type: payload.exc_type,
          severity: payload.severity,
          title: payload.title,
          description: payload.description || null,
          raised_by: payload.raised_by,
          blocks_readiness: payload.blocks_readiness ?? (payload.severity === "blocking"),
        })
        .select()
        .single();

      if (error) {
        logger.error("handoff.raiseException_failed", {}, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ConsignmentException };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async resolveException(payload: ResolveExceptionPayload): Promise<ServiceResult<void>> {
    try {
      if (!payload.exception_id || !payload.resolved_by || !payload.resolution) {
        return { success: false, error: "exception_id, resolved_by y resolution son requeridos" };
      }

      const { error } = await supabase
        .from("consignment_exceptions")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: payload.resolved_by,
          resolution: payload.resolution,
        })
        .eq("id", payload.exception_id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getCaseExceptions(consignmentId: string): Promise<ServiceResult<ConsignmentException[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_exceptions")
        .select(`
          *,
          raiser:raised_by (full_name),
          resolver:resolved_by (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .order("raised_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentException[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getOpenExceptions(consignmentId: string): Promise<ServiceResult<ConsignmentException[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_exceptions")
        .select(`
          *,
          raiser:raised_by (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .eq("resolved", false)
        .order("severity", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentException[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getBlockingExceptions(consignmentId: string): Promise<ServiceResult<ConsignmentException[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_exceptions")
        .select(`
          *,
          raiser:raised_by (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .eq("blocks_readiness", true)
        .eq("resolved", false)
        .order("raised_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentException[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getExceptionSummary(consignmentId: string): Promise<ServiceResult<{
    total: number;
    open: number;
    resolved: number;
    blocking: number;
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
  }>> {
    try {
      const { data, error } = await supabase
        .from("consignment_exceptions")
        .select("exc_type, severity, resolved, blocks_readiness")
        .eq("consignment_id", consignmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      const all = data || [];
      const bySeverity: Record<string, number> = {};
      const byType: Record<string, number> = {};
      let open = 0;
      let resolved = 0;
      let blocking = 0;

      all.forEach((e: any) => {
        bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
        byType[e.exc_type] = (byType[e.exc_type] || 0) + 1;
        if (e.resolved) resolved++;
        else open++;
        if (e.blocks_readiness && !e.resolved) blocking++;
      });

      return {
        success: true,
        data: {
          total: all.length,
          open,
          resolved,
          blocking,
          by_severity: bySeverity,
          by_type: byType,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
};
