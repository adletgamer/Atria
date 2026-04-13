/**
 * trackingService.ts
 * Servicio para gestión de eventos de tracking (lot_events)
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { ServiceResult, TimelineEvent } from "@/types/lot.types";
import { EVENT_TYPES, EVENT_CATEGORIES } from "@/types/lot.types";

export interface CreateEventPayload {
  lot_id: string; // UUID del lote
  event_type: string;
  event_category: string;
  actor_id?: string | null;
  location?: string | null;
  description?: string | null;
  metadata?: Record<string, any>;
  occurred_at?: string | null;
}

export const trackingService = {
  /**
   * Crea un evento de tracking
   */
  async createEvent(payload: CreateEventPayload): Promise<ServiceResult> {
    try {
      const { error } = await supabase.from("lot_events").insert({
        lot_id: payload.lot_id,
        event_type: payload.event_type,
        event_category: payload.event_category,
        actor_id: payload.actor_id || null,
        location: payload.location || null,
        description: payload.description || null,
        metadata: payload.metadata || {},
        occurred_at: payload.occurred_at || new Date().toISOString(),
      });

      if (error) {
        logger.error("tracking.createEvent_failed", {}, error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error("tracking.createEvent_exception", {}, error);
      return {
        success: false,
        error: error.message || "Error al crear evento",
      };
    }
  },

  /**
   * Obtiene el timeline completo de un lote
   */
  async getLotTimeline(lotId: string): Promise<ServiceResult<TimelineEvent[]>> {
    try {
      const { data, error } = await supabase.rpc("get_lot_timeline", {
        p_lot_id: lotId,
      });

      if (error) {
        logger.error("tracking.getTimeline_failed", {}, error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error: any) {
      logger.error("tracking.getTimeline_exception", {}, error);
      return {
        success: false,
        error: error.message || "Error al obtener timeline",
      };
    }
  },

  /**
   * Obtiene eventos de un lote por categoría
   */
  async getEventsByCategory(
    lotId: string,
    category: string
  ): Promise<ServiceResult<TimelineEvent[]>> {
    try {
      // Primero obtener UUID del lote
      const { data: lot } = await supabase
        .from("lots")
        .select("id")
        .eq("lot_id", lotId)
        .single();

      if (!lot) {
        return {
          success: false,
          error: "Lote no encontrado",
        };
      }

      const { data, error } = await supabase
        .from("lot_events")
        .select(
          `
          id,
          event_type,
          event_category,
          description,
          location,
          occurred_at,
          profiles!lot_events_actor_id_fkey(full_name)
        `
        )
        .eq("lot_id", lot.id)
        .eq("event_category", category)
        .order("occurred_at", { ascending: true });

      if (error) {
        logger.error("tracking.getByCategory_failed", {}, error);
        return {
          success: false,
          error: error.message,
        };
      }

      const events = (data || []).map((event: any) => ({
        event_id: event.id,
        event_type: event.event_type,
        event_category: event.event_category,
        description: event.description,
        location: event.location,
        actor_name: event.profiles?.full_name || null,
        occurred_at: event.occurred_at,
      }));

      return {
        success: true,
        data: events,
      };
    } catch (error: any) {
      logger.error("tracking.getByCategory_exception", {}, error);
      return {
        success: false,
        error: error.message || "Error al obtener eventos",
      };
    }
  },

  /**
   * Registra evento de cambio de atributo
   */
  async logAttributeChange(
    lotId: string,
    attributeKey: string,
    oldValue: string | null,
    newValue: string,
    actorId: string
  ): Promise<ServiceResult> {
    return this.createEvent({
      lot_id: lotId,
      event_type: oldValue ? EVENT_TYPES.ATTRIBUTE_UPDATED : EVENT_TYPES.ATTRIBUTE_SET,
      event_category: EVENT_CATEGORIES.ATTRIBUTE_CHANGE,
      actor_id: actorId,
      description: `Atributo ${attributeKey} ${oldValue ? "actualizado" : "establecido"}`,
      metadata: {
        attribute_key: attributeKey,
        old_value: oldValue,
        new_value: newValue,
      },
    });
  },

  /**
   * Registra evento de listado en marketplace
   */
  async logMarketplaceListing(
    lotId: string,
    actorId: string,
    listed: boolean
  ): Promise<ServiceResult> {
    return this.createEvent({
      lot_id: lotId,
      event_type: listed ? EVENT_TYPES.LOT_LISTED : EVENT_TYPES.LOT_UNLISTED,
      event_category: EVENT_CATEGORIES.ATTRIBUTE_CHANGE,
      actor_id: actorId,
      description: listed
        ? "Lote listado en marketplace"
        : "Lote removido del marketplace",
    });
  },

  /**
   * Obtiene estadísticas de eventos de un lote
   */
  async getLotEventStats(lotId: string): Promise<
    ServiceResult<{
      total_events: number;
      by_category: Record<string, number>;
      last_event_at: string | null;
    }>
  > {
    try {
      // Obtener UUID del lote
      const { data: lot } = await supabase
        .from("lots")
        .select("id")
        .eq("lot_id", lotId)
        .single();

      if (!lot) {
        return {
          success: false,
          error: "Lote no encontrado",
        };
      }

      const { data, error } = await supabase
        .from("lot_events")
        .select("event_category, occurred_at")
        .eq("lot_id", lot.id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const events = data || [];
      const byCategory = events.reduce(
        (acc: Record<string, number>, event: any) => {
          acc[event.event_category] = (acc[event.event_category] || 0) + 1;
          return acc;
        },
        {}
      );

      const lastEvent = events.length > 0
        ? events.reduce((latest: any, current: any) =>
            new Date(current.occurred_at) > new Date(latest.occurred_at)
              ? current
              : latest
          )
        : null;

      return {
        success: true,
        data: {
          total_events: events.length,
          by_category: byCategory,
          last_event_at: lastEvent?.occurred_at || null,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Error al obtener estadísticas",
      };
    }
  },
};
