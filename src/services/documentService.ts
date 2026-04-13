/**
 * documentService.ts
 * Gestión de documentos y attestations de consignaciones.
 * 
 * Documentos = evidencia verificable (phyto cert, BoL, packing list, etc.)
 * Attestations = assertions humanas (quality confirmed, docs complete, etc.)
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type {
  ServiceResult,
  ConsignmentDocument,
  ConsignmentAttestation,
  UploadDocumentPayload,
  CreateAttestationPayload,
  DocumentType,
} from "@/types/consignment.types";

export const documentService = {

  // ============================================
  // DOCUMENTOS
  // ============================================

  async uploadDocument(payload: UploadDocumentPayload): Promise<ServiceResult<ConsignmentDocument>> {
    try {
      if (!payload.consignment_id || !payload.doc_type || !payload.title) {
        return { success: false, error: "consignment_id, doc_type y title son requeridos" };
      }

      const { data, error } = await supabase
        .from("consignment_documents")
        .insert({
          consignment_id: payload.consignment_id,
          doc_type: payload.doc_type,
          title: payload.title,
          file_url: payload.file_url || null,
          file_hash: payload.file_hash || null,
          issued_by: payload.issued_by || null,
          issued_at: payload.issued_at || null,
          expires_at: payload.expires_at || null,
        })
        .select()
        .single();

      if (error) {
        logger.error("document.upload_failed", {}, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ConsignmentDocument };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async verifyDocument(
    documentId: string,
    verifiedBy: string
  ): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from("consignment_documents")
        .update({
          verified: true,
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getCaseDocuments(consignmentId: string): Promise<ServiceResult<ConsignmentDocument[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_documents")
        .select(`
          *,
          verified_by_profile:verified_by (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .order("created_at", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentDocument[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getDocumentsByType(
    consignmentId: string,
    docType: DocumentType
  ): Promise<ServiceResult<ConsignmentDocument[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_documents")
        .select("*")
        .eq("consignment_id", consignmentId)
        .eq("doc_type", docType)
        .order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentDocument[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getDocCompleteness(consignmentId: string): Promise<ServiceResult<{
    total: number;
    verified: number;
    pending: number;
    expired: number;
    by_type: Record<string, { present: boolean; verified: boolean; expired: boolean }>;
  }>> {
    try {
      const { data, error } = await supabase
        .from("consignment_documents")
        .select("doc_type, verified, expires_at")
        .eq("consignment_id", consignmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      const docs = data || [];
      const now = new Date();
      const byType: Record<string, { present: boolean; verified: boolean; expired: boolean }> = {};

      let verified = 0;
      let expired = 0;

      docs.forEach((doc: any) => {
        const isExpired = doc.expires_at && new Date(doc.expires_at) < now;
        if (doc.verified) verified++;
        if (isExpired) expired++;

        byType[doc.doc_type] = {
          present: true,
          verified: doc.verified,
          expired: !!isExpired,
        };
      });

      return {
        success: true,
        data: {
          total: docs.length,
          verified,
          pending: docs.length - verified,
          expired,
          by_type: byType,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // ATTESTATIONS
  // ============================================

  async createAttestation(payload: CreateAttestationPayload): Promise<ServiceResult<ConsignmentAttestation>> {
    try {
      if (!payload.consignment_id || !payload.att_type || !payload.attested_by || !payload.role_at_time) {
        return { success: false, error: "consignment_id, att_type, attested_by y role_at_time son requeridos" };
      }

      const { data, error } = await supabase
        .from("consignment_attestations")
        .insert({
          consignment_id: payload.consignment_id,
          att_type: payload.att_type,
          claim_type: payload.claim_type || null,
          attested_by: payload.attested_by,
          role_at_time: payload.role_at_time,
          statement: payload.statement || null,
          evidence_refs: payload.evidence_refs || [],
          sig_method: payload.sig_method || "platform_auth",
          supersedes: payload.supersedes || null,
        })
        .select()
        .single();

      if (error) {
        logger.error("document.createAttestation_failed", {}, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ConsignmentAttestation };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async revokeAttestation(
    attestationId: string,
    reason: string
  ): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from("consignment_attestations")
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: reason,
        })
        .eq("id", attestationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getCaseAttestations(consignmentId: string): Promise<ServiceResult<ConsignmentAttestation[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_attestations")
        .select(`
          *,
          attester:attested_by (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .order("attested_at", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentAttestation[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getActiveAttestations(consignmentId: string): Promise<ServiceResult<ConsignmentAttestation[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_attestations")
        .select(`
          *,
          attester:attested_by (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .eq("revoked", false)
        .order("attested_at", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as ConsignmentAttestation[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
};
