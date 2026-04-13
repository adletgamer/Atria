/**
 * auditService.ts
 * Audit trail logging for critical actions
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { ServiceResult } from "@/types/consignment.types";

export type AuditEventType =
  | 'evidence_uploaded'
  | 'attestation_requested'
  | 'exception_resolved'
  | 'pack_generated'
  | 'pack_anchored'
  | 'consignment_created'
  | 'consignment_updated'
  | 'state_recomputed'
  | 'handoff_recorded';

export interface AuditEvent {
  id: string;
  consignment_id: string;
  event_type: AuditEventType;
  event_data: Record<string, any>;
  created_by: string;
  created_at: string;
}

export interface CreateAuditEventPayload {
  consignment_id: string;
  event_type: AuditEventType;
  event_data: Record<string, any>;
  created_by: string;
}

export const auditService = {
  /**
   * Log an audit event to consignment_events table
   */
  async logEvent(payload: CreateAuditEventPayload): Promise<ServiceResult<AuditEvent>> {
    try {
      const { data, error } = await supabase
        .from('consignment_events')
        .insert({
          consignment_id: payload.consignment_id,
          event_type: payload.event_type,
          event_data: payload.event_data,
          created_by: payload.created_by,
        })
        .select()
        .single();

      if (error) {
        logger.error('audit.log_failed', { event_type: payload.event_type }, error);
        return { success: false, error: error.message };
      }

      logger.info('audit.logged', {
        consignment_id: payload.consignment_id,
        event_type: payload.event_type,
      });

      return { success: true, data: data as unknown as AuditEvent };
    } catch (error: any) {
      logger.error('audit.log_exception', { event_type: payload.event_type }, error);
      return { success: false, error: error.message || 'Failed to log audit event' };
    }
  },

  /**
   * Get audit trail for a consignment
   */
  async getAuditTrail(consignmentId: string): Promise<ServiceResult<AuditEvent[]>> {
    try {
      const { data, error } = await supabase
        .from('consignment_events')
        .select('*')
        .eq('consignment_id', consignmentId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('audit.get_trail_failed', { consignment_id: consignmentId }, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as unknown as AuditEvent[] };
    } catch (error: any) {
      logger.error('audit.get_trail_exception', { consignment_id: consignmentId }, error);
      return { success: false, error: error.message || 'Failed to get audit trail' };
    }
  },

  /**
   * Get audit trail filtered by event type
   */
  async getAuditTrailByType(
    consignmentId: string,
    eventType: AuditEventType
  ): Promise<ServiceResult<AuditEvent[]>> {
    try {
      const { data, error } = await supabase
        .from('consignment_events')
        .select('*')
        .eq('consignment_id', consignmentId)
        .eq('event_type', eventType)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('audit.get_trail_by_type_failed', { consignment_id: consignmentId, event_type: eventType }, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as unknown as AuditEvent[] };
    } catch (error: any) {
      logger.error('audit.get_trail_by_type_exception', { consignment_id: consignmentId, event_type: eventType }, error);
      return { success: false, error: error.message || 'Failed to get audit trail' };
    }
  },

  /**
   * Helper: Log evidence upload
   */
  async logEvidenceUpload(
    consignmentId: string,
    evidenceId: string,
    fileName: string,
    fileSize: number,
    evidenceType: string,
    userId: string
  ): Promise<ServiceResult<AuditEvent>> {
    return this.logEvent({
      consignment_id: consignmentId,
      event_type: 'evidence_uploaded',
      event_data: {
        evidence_id: evidenceId,
        file_name: fileName,
        file_size: fileSize,
        evidence_type: evidenceType,
      },
      created_by: userId,
    });
  },

  /**
   * Helper: Log attestation request
   */
  async logAttestationRequest(
    consignmentId: string,
    attestationType: string,
    actorEmail: string,
    actorName: string,
    userId: string
  ): Promise<ServiceResult<AuditEvent>> {
    return this.logEvent({
      consignment_id: consignmentId,
      event_type: 'attestation_requested',
      event_data: {
        attestation_type: attestationType,
        actor_email: actorEmail,
        actor_name: actorName,
      },
      created_by: userId,
    });
  },

  /**
   * Helper: Log exception resolution
   */
  async logExceptionResolution(
    consignmentId: string,
    exceptionId: string,
    exceptionType: string,
    resolutionNotes: string,
    userId: string
  ): Promise<ServiceResult<AuditEvent>> {
    return this.logEvent({
      consignment_id: consignmentId,
      event_type: 'exception_resolved',
      event_data: {
        exception_id: exceptionId,
        exception_type: exceptionType,
        resolution_notes: resolutionNotes,
      },
      created_by: userId,
    });
  },

  /**
   * Helper: Log pack generation
   */
  async logPackGeneration(
    consignmentId: string,
    packHash: string,
    decisionContext: string,
    userId: string
  ): Promise<ServiceResult<AuditEvent>> {
    return this.logEvent({
      consignment_id: consignmentId,
      event_type: 'pack_generated',
      event_data: {
        pack_hash: packHash,
        decision_context: decisionContext,
      },
      created_by: userId,
    });
  },

  /**
   * Helper: Log pack anchoring
   */
  async logPackAnchoring(
    consignmentId: string,
    packHash: string,
    chainTxHash: string,
    chainId: string,
    userId: string
  ): Promise<ServiceResult<AuditEvent>> {
    return this.logEvent({
      consignment_id: consignmentId,
      event_type: 'pack_anchored',
      event_data: {
        pack_hash: packHash,
        chain_tx_hash: chainTxHash,
        chain_id: chainId,
      },
      created_by: userId,
    });
  },
};
