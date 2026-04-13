/**
 * consignmentService.ts
 * Servicio core para Consignment Cases — objeto raíz de decisión
 * 
 * Reemplaza el flujo lot-centric con un modelo consignment-centric
 * para export managers y compliance leads.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type {
  ServiceResult,
  ConsignmentCase,
  ConsignmentWithDetails,
  ConsignmentEvent,
  ReadinessState,
  ReadinessChecklist,
  CreateConsignmentPayload,
  AddLotPayload,
  ConsignmentStatus,
} from "@/types/consignment.types";

export const consignmentService = {

  // ============================================
  // CREAR CONSIGNMENT CASE
  // ============================================

  async createCase(payload: CreateConsignmentPayload): Promise<ServiceResult<{ case_uuid: string; case_number: string }>> {
    try {
      // Validación: formato case_number
      if (!this.validateCaseNumberFormat(payload.case_number)) {
        return { success: false, error: "Formato inválido. Usa: CS-YYYY-NNN (ej: CS-2026-001)" };
      }

      // Validación: exporter_id requerido
      if (!payload.exporter_id) {
        return { success: false, error: "exporter_id es requerido" };
      }

      // Validación: destination_country requerido
      if (!payload.destination_country) {
        return { success: false, error: "destination_country es requerido" };
      }

      // Validación: case_number único
      const exists = await this.caseNumberExists(payload.case_number);
      if (exists) {
        return { success: false, error: "El case_number ya existe" };
      }

      const { data, error } = await supabase
        .rpc("create_consignment_case", {
          p_case_number: payload.case_number,
          p_exporter_id: payload.exporter_id,
          p_destination_country: payload.destination_country,
          p_destination_port: payload.destination_port || null,
          p_incoterm: payload.incoterm || null,
          p_estimated_departure: payload.estimated_departure || null,
          p_importer_id: payload.importer_id || null,
        });

      if (error) {
        logger.error("consignment.createCase_failed", {}, error);
        return { success: false, error: error.message };
      }

      const row = Array.isArray(data) ? data[0] : data;
      return {
        success: true,
        data: {
          case_uuid: row.case_uuid,
          case_number: row.case_case_number,
        },
      };
    } catch (error) {
      logger.error("consignment.createCase_exception", {}, error);
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // OBTENER CONSIGNMENT CON DETALLES
  // ============================================

  async getCaseByNumber(caseNumber: string): Promise<ServiceResult<ConsignmentWithDetails>> {
    try {
      const { data, error } = await supabase
        .rpc("get_consignment_with_details", {
          p_case_number: caseNumber,
        });

      if (error) {
        logger.error("consignment.getCaseByNumber_failed", {}, error);
        return { success: false, error: error.message };
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        return { success: false, error: "Consignment case no encontrado" };
      }

      return { success: true, data: row as ConsignmentWithDetails };
    } catch (error) {
      logger.error("consignment.getCaseByNumber_exception", {}, error);
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // LISTAR CASES DEL EXPORTER
  // ============================================

  async getMyCases(exporterId: string, limit = 20, offset = 0): Promise<ServiceResult<ConsignmentCase[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_cases")
        .select("*")
        .eq("exporter_id", exporterId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error("consignment.getMyCases_failed", {}, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentCase[] };
    } catch (error) {
      logger.error("consignment.getMyCases_exception", {}, error);
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // LISTAR CASES RECIBIDOS (IMPORTER)
  // ============================================

  async getIncomingCases(importerId: string, limit = 20): Promise<ServiceResult<ConsignmentCase[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_cases")
        .select("*")
        .eq("importer_id", importerId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentCase[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // AGREGAR LOTE A CONSIGNMENT
  // ============================================

  async addLot(payload: AddLotPayload): Promise<ServiceResult<{ id: string }>> {
    try {
      if (!payload.consignment_id || !payload.lot_id) {
        return { success: false, error: "consignment_id y lot_id son requeridos" };
      }

      // Auto-calcular sequence_number si no se provee
      let seq = payload.sequence_number;
      if (!seq) {
        const { count } = await supabase
          .from("consignment_lots")
          .select("*", { count: "exact", head: true })
          .eq("consignment_id", payload.consignment_id);
        seq = (count || 0) + 1;
      }

      const { data, error } = await supabase
        .from("consignment_lots")
        .insert({
          consignment_id: payload.consignment_id,
          lot_id: payload.lot_id,
          sequence_number: seq,
          notes: payload.notes || null,
        })
        .select("id")
        .single();

      if (error) {
        logger.error("consignment.addLot_failed", {}, error);
        if (error.code === "23505") {
          return { success: false, error: "Este lote ya está asignado a esta consignación" };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data: { id: data.id } };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // OBTENER LOTES DE UNA CONSIGNMENT
  // ============================================

  async getCaseLots(consignmentId: string): Promise<ServiceResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_lots")
        .select(`
          id,
          sequence_number,
          notes,
          created_at,
          lots (
            id,
            lot_id,
            origin_location,
            harvest_date,
            created_at,
            lot_attributes (
              attribute_key,
              attribute_value,
              verified
            )
          )
        `)
        .eq("consignment_id", consignmentId)
        .order("sequence_number", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // ACTUALIZAR STATUS
  // ============================================

  async updateStatus(consignmentId: string, newStatus: ConsignmentStatus): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from("consignment_cases")
        .update({ status: newStatus })
        .eq("id", consignmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // REFRESH READINESS
  // ============================================

  async refreshReadiness(consignmentId: string): Promise<ServiceResult<ReadinessState>> {
    try {
      const { data, error } = await supabase
        .rpc("refresh_consignment_readiness", {
          p_consignment_id: consignmentId,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ReadinessState };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // OBTENER READINESS CHECKLIST
  // ============================================

  async getReadinessChecklist(consignmentId: string): Promise<ServiceResult<ReadinessChecklist>> {
    try {
      // Fetch documents
      const { data: docs } = await supabase
        .from("consignment_documents")
        .select("doc_type, verified")
        .eq("consignment_id", consignmentId);

      // Fetch attestations (no revocadas)
      const { data: atts } = await supabase
        .from("consignment_attestations")
        .select("att_type")
        .eq("consignment_id", consignmentId)
        .eq("revoked", false);

      // Fetch blocking exceptions
      const { count: blockingCount } = await supabase
        .from("consignment_exceptions")
        .select("*", { count: "exact", head: true })
        .eq("consignment_id", consignmentId)
        .eq("blocks_readiness", true)
        .eq("resolved", false);

      // Fetch lot count
      const { count: lotCount } = await supabase
        .from("consignment_lots")
        .select("*", { count: "exact", head: true })
        .eq("consignment_id", consignmentId);

      const docSet = new Set((docs || []).filter((d: any) => d.verified).map((d: any) => d.doc_type));
      const docPresent = new Set((docs || []).map((d: any) => d.doc_type));
      const attSet = new Set((atts || []).map((a: any) => a.att_type));

      // Compute readiness
      const { data: readiness } = await supabase
        .rpc("compute_consignment_readiness", { p_consignment_id: consignmentId });

      const checklist: ReadinessChecklist = {
        has_lots: (lotCount || 0) > 0,
        has_phytosanitary: docSet.has("phytosanitary_cert"),
        has_origin_cert: docSet.has("certificate_of_origin"),
        has_packing_list: docPresent.has("packing_list"),
        has_commercial_invoice: docPresent.has("commercial_invoice"),
        has_bill_of_lading: docSet.has("bill_of_lading"),
        has_customs_declaration: docPresent.has("customs_declaration"),
        att_quality_confirmed: attSet.has("quality_confirmed"),
        att_docs_complete: attSet.has("docs_complete"),
        att_export_cleared: attSet.has("export_cleared"),
        att_import_cleared: attSet.has("import_cleared"),
        att_customs_released: attSet.has("customs_released"),
        blocking_exceptions: blockingCount || 0,
        computed_readiness: (readiness as ReadinessState) || "not_ready",
      };

      return { success: true, data: checklist };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // OBTENER TIMELINE DE EVENTOS
  // ============================================

  async getCaseTimeline(consignmentId: string): Promise<ServiceResult<ConsignmentEvent[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_events")
        .select(`
          *,
          profiles:actor_id (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .order("occurred_at", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentEvent[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // DASHBOARD STATS PARA EXPORT MANAGER
  // ============================================

  async getExporterDashboard(exporterId: string): Promise<ServiceResult<{
    total_cases: number;
    draft: number;
    in_progress: number;
    ready_to_ship: number;
    in_transit: number;
    cleared: number;
    exceptions: number;
    open_blocking_exceptions: number;
  }>> {
    try {
      const { data: cases, error } = await supabase
        .from("consignment_cases")
        .select("status")
        .eq("exporter_id", exporterId);

      if (error) {
        return { success: false, error: error.message };
      }

      const all = cases || [];
      const statusCounts = all.reduce((acc: Record<string, number>, c: any) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count open blocking exceptions across all cases
      const { count: blockingCount } = await supabase
        .from("consignment_exceptions")
        .select("*, consignment_cases!inner(exporter_id)", { count: "exact", head: true })
        .eq("consignment_cases.exporter_id", exporterId)
        .eq("blocks_readiness", true)
        .eq("resolved", false);

      return {
        success: true,
        data: {
          total_cases: all.length,
          draft: statusCounts["draft"] || 0,
          in_progress: (statusCounts["pending_docs"] || 0) + (statusCounts["pending_inspection"] || 0),
          ready_to_ship: statusCounts["ready_to_ship"] || 0,
          in_transit: statusCounts["in_transit"] || 0,
          cleared: statusCounts["cleared"] || 0,
          exceptions: (statusCounts["exception"] || 0) + (statusCounts["customs_hold"] || 0),
          open_blocking_exceptions: blockingCount || 0,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // UTILIDADES
  // ============================================

  validateCaseNumberFormat(caseNumber: string): boolean {
    return /^CS-\d{4}-\d{3,6}$/.test(caseNumber);
  },

  async caseNumberExists(caseNumber: string): Promise<boolean> {
    const { count } = await supabase
      .from("consignment_cases")
      .select("*", { count: "exact", head: true })
      .eq("case_number", caseNumber);
    return (count || 0) > 0;
  },

  generateNextCaseNumber(year?: number): string {
    const y = year || new Date().getFullYear();
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `CS-${y}-${rand}`;
  },
};
