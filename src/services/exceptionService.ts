/**
 * exceptionService.ts
 * Domain service for consignment exception management.
 * Wraps evaluate_consignment_exceptions RPC and provides resolve/list operations.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type {
  ServiceResult,
  ConsignmentException,
} from "@/types/consignment.types";

export interface ExceptionEvaluation {
  consignment_id: string;
  exceptions: Array<{
    exception_id: string;
    exc_type: string;
    severity: string;
    title: string;
    is_new: boolean;
  }>;
  snapshot_id: string | null;
}

export interface ResolveExceptionPayload {
  exception_id: string;
  resolved_by: string;
  resolution: string;
}

export const exceptionService = {
  /**
   * Evaluates all 4 exception rules for a consignment and auto-creates/resolves exceptions.
   * Then creates a state snapshot capturing the new state.
   *
   * Rules:
   *  1. Missing required evidence type → doc_missing / blocking
   *  2. Expired document → doc_expired / blocking
   *  3. Missing required attestation → regulatory_block / warning
   *  4. Custody gap → customs_hold / blocking
   */
  async evaluateConsignment(
    consignmentId: string,
    actorId: string
  ): Promise<ServiceResult<ExceptionEvaluation>> {
    try {
      // 1. Run exception evaluation RPC
      const { data: evalData, error: evalError } = await supabase.rpc(
        "evaluate_consignment_exceptions",
        {
          p_consignment_id: consignmentId,
          p_actor_id: actorId,
        }
      );

      if (evalError) {
        logger.error("exception.evaluate_failed", { consignment_id: consignmentId }, evalError);
        return { success: false, error: evalError.message };
      }

      const exceptions = (evalData || []).map((row: any) => ({
        exception_id: row.exception_id,
        exc_type: row.exc_type,
        severity: row.severity,
        title: row.title,
        is_new: row.is_new,
      }));

      // 2. Create state snapshot after evaluation
      let snapshotId: string | null = null;
      try {
        const { data: snapData, error: snapError } = await supabase.rpc(
          "create_state_snapshot",
          {
            p_consignment_id: consignmentId,
            p_trigger: "exception_raised",
            p_triggered_by: actorId,
          }
        );

        if (snapError) {
          logger.warn("exception.snapshot_failed", { consignment_id: consignmentId }, snapError);
        } else {
          snapshotId = snapData;
        }
      } catch (snapErr) {
        logger.warn("exception.snapshot_exception", { consignment_id: consignmentId }, snapErr);
      }

      logger.info("exception.evaluated", {
        consignment_id: consignmentId,
        total: exceptions.length,
        new_count: exceptions.filter((e: any) => e.is_new).length,
        snapshot_id: snapshotId,
      });

      return {
        success: true,
        data: {
          consignment_id: consignmentId,
          exceptions,
          snapshot_id: snapshotId,
        },
      };
    } catch (error) {
      logger.error("exception.evaluate_exception", { consignment_id: consignmentId }, error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Resolves an exception with a reason.
   */
  async resolveException(
    payload: ResolveExceptionPayload
  ): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from("consignment_exceptions")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: payload.resolved_by,
          resolution: payload.resolution,
        })
        .eq("id", payload.exception_id)
        .eq("resolved", false);

      if (error) {
        logger.error("exception.resolve_failed", { exception_id: payload.exception_id }, error);
        return { success: false, error: error.message };
      }

      logger.info("exception.resolved", {
        exception_id: payload.exception_id,
        resolved_by: payload.resolved_by,
      });

      return { success: true };
    } catch (error) {
      logger.error("exception.resolve_exception", { exception_id: payload.exception_id }, error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Gets all exceptions for a consignment.
   */
  async getExceptions(
    consignmentId: string,
    includeResolved: boolean = false
  ): Promise<ServiceResult<ConsignmentException[]>> {
    try {
      let query = supabase
        .from("consignment_exceptions")
        .select("*")
        .eq("consignment_id", consignmentId)
        .order("raised_at", { ascending: false });

      if (!includeResolved) {
        query = query.eq("resolved", false);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("exception.list_failed", { consignment_id: consignmentId }, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as unknown as ConsignmentException[] };
    } catch (error) {
      logger.error("exception.list_exception", { consignment_id: consignmentId }, error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Gets blocking exceptions only.
   */
  async getBlockingExceptions(
    consignmentId: string
  ): Promise<ServiceResult<ConsignmentException[]>> {
    try {
      const { data, error } = await supabase
        .from("consignment_exceptions")
        .select("*")
        .eq("consignment_id", consignmentId)
        .eq("resolved", false)
        .eq("blocks_readiness", true)
        .order("raised_at", { ascending: false });

      if (error) {
        logger.error("exception.blocking_failed", { consignment_id: consignmentId }, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as unknown as ConsignmentException[] };
    } catch (error) {
      logger.error("exception.blocking_exception", { consignment_id: consignmentId }, error);
      return { success: false, error: String(error) };
    }
  },
};
