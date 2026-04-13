/**
 * lotService.ts
 * Servicio unificado para gestión de lotes
 * Reemplaza batchService.ts con arquitectura limpia
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type {
  CreateLotPayload,
  CreateLotResult,
  ServiceResult,
  LotWithDetails,
} from "@/types/lot.types";

export const lotService = {
  /**
   * Crea un lote completo con todos sus componentes
   * TRANSACCIÓN ATÓMICA: lots + lot_attributes + lot_events + trust_states
   */
  async createLot(payload: CreateLotPayload): Promise<CreateLotResult> {
    try {
      // VALIDACIÓN 1: Formato de lot_id
      if (!this.validateLotIdFormat(payload.lot_id)) {
        return {
          success: false,
          error: "Formato de lot_id inválido. Usa: XX-YYYY-NNN (ej: MG-2025-001)",
        };
      }

      // VALIDACIÓN 2: Unicidad de lot_id
      const exists = await this.lotIdExists(payload.lot_id);
      if (exists) {
        return {
          success: false,
          error: "El lot_id ya existe. Usa un identificador diferente.",
        };
      }

      // VALIDACIÓN 3: Producer existe
      const producerExists = await this.producerExists(payload.producer_id);
      if (!producerExists) {
        return {
          success: false,
          error: "El productor no existe en el sistema.",
        };
      }

      // LLAMADA A RPC: Transacción atómica
      const { data, error } = await supabase.rpc("create_lot_complete", {
        p_lot_id: payload.lot_id,
        p_producer_id: payload.producer_id,
        p_origin_location: payload.origin_location,
        p_harvest_date: payload.harvest_date || null,
        p_attributes: payload.attributes,
      });

      if (error) {
        logger.error("lot.create_failed", {}, error);
        return {
          success: false,
          error: error.message || "Error al crear el lote",
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: "No se recibió respuesta del servidor",
        };
      }

      return {
        success: true,
        data: {
          lot_uuid: data[0].lot_uuid,
          lot_id: data[0].lot_lot_id,
        },
      };
    } catch (error: any) {
      logger.error("lot.create_exception", {}, error);
      return {
        success: false,
        error: error.message || "Error inesperado al crear el lote",
      };
    }
  },

  /**
   * Obtiene un lote completo con atributos y trust_state
   */
  async getLotByLotId(lotId: string): Promise<ServiceResult<LotWithDetails>> {
    try {
      const { data, error } = await supabase.rpc("get_lot_with_details", {
        p_lot_id: lotId,
      });

      if (error) {
        logger.error("lot.getByLotId_failed", {}, error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: "Lote no encontrado",
        };
      }

      return {
        success: true,
        data: data[0],
      };
    } catch (error: any) {
      logger.error("lot.getByLotId_exception", {}, error);
      return {
        success: false,
        error: error.message || "Error al obtener el lote",
      };
    }
  },

  /**
   * Obtiene todos los lotes con paginación
   */
  async getAllLots(
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResult<LotWithDetails[]>> {
    try {
      const { data, error } = await supabase
        .from("lots")
        .select(
          `
          id,
          lot_id,
          producer_id,
          origin_location,
          harvest_date,
          created_at,
          profiles!lots_producer_id_fkey(full_name),
          trust_states(trust_score, verification_count, last_verified_at)
        `
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error("lot.getAll_failed", {}, error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Transformar datos
      const lots = await Promise.all(
        (data || []).map(async (lot: any) => {
          // Obtener atributos
          const { data: attrs } = await supabase
            .from("lot_attributes")
            .select("attribute_key, attribute_value")
            .eq("lot_id", lot.id);

          const attributes = (attrs || []).reduce(
            (acc: any, attr: any) => {
              acc[attr.attribute_key] = attr.attribute_value;
              return acc;
            },
            {}
          );

          return {
            lot_uuid: lot.id,
            lot_id: lot.lot_id,
            producer_id: lot.producer_id,
            producer_name: lot.profiles?.full_name || null,
            origin_location: lot.origin_location,
            harvest_date: lot.harvest_date,
            created_at: lot.created_at,
            attributes,
            trust_score: lot.trust_states?.trust_score || 0,
            verification_count: lot.trust_states?.verification_count || 0,
            last_verified_at: lot.trust_states?.last_verified_at || null,
          };
        })
      );

      return {
        success: true,
        data: lots,
      };
    } catch (error: any) {
      logger.error("lot.getAll_exception", {}, error);
      return {
        success: false,
        error: error.message || "Error al obtener lotes",
      };
    }
  },

  /**
   * Actualiza un atributo de un lote
   */
  async updateLotAttribute(
    lotId: string,
    attributeKey: string,
    attributeValue: string
  ): Promise<ServiceResult> {
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

      // Actualizar o insertar atributo
      const { error } = await supabase
        .from("lot_attributes")
        .upsert(
          {
            lot_id: lot.id,
            attribute_key: attributeKey,
            attribute_value: attributeValue,
          },
          {
            onConflict: "lot_id,attribute_key",
          }
        );

      if (error) {
        logger.error("lot.updateAttribute_failed", {}, error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error("lot.updateAttribute_exception", {}, error);
      return {
        success: false,
        error: error.message || "Error al actualizar atributo",
      };
    }
  },

  /**
   * Valida formato de lot_id: XX-YYYY-NNN
   */
  validateLotIdFormat(lotId: string): boolean {
    const regex = /^[A-Z]{2,4}-\d{4}-\d{3,6}$/;
    return regex.test(lotId);
  },

  /**
   * Verifica si un lot_id ya existe
   */
  async lotIdExists(lotId: string): Promise<boolean> {
    const { data } = await supabase
      .from("lots")
      .select("id")
      .eq("lot_id", lotId)
      .maybeSingle();

    return !!data;
  },

  /**
   * Verifica si un productor existe
   */
  async producerExists(producerId: string): Promise<boolean> {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", producerId)
      .maybeSingle();

    return !!data;
  },

  /**
   * Obtiene lotes de un productor específico
   */
  async getLotsByProducer(
    producerId: string
  ): Promise<ServiceResult<LotWithDetails[]>> {
    try {
      const { data, error } = await supabase
        .from("lots")
        .select(
          `
          id,
          lot_id,
          producer_id,
          origin_location,
          harvest_date,
          created_at
        `
        )
        .eq("producer_id", producerId)
        .order("created_at", { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Transformar con atributos
      const lots = await Promise.all(
        (data || []).map(async (lot: any) => {
          const { data: attrs } = await supabase
            .from("lot_attributes")
            .select("attribute_key, attribute_value")
            .eq("lot_id", lot.id);

          const attributes = (attrs || []).reduce(
            (acc: any, attr: any) => {
              acc[attr.attribute_key] = attr.attribute_value;
              return acc;
            },
            {}
          );

          const { data: trust } = await supabase
            .from("trust_states")
            .select("trust_score, verification_count, last_verified_at")
            .eq("lot_id", lot.id)
            .single();

          return {
            lot_uuid: lot.id,
            lot_id: lot.lot_id,
            producer_id: lot.producer_id,
            producer_name: null,
            origin_location: lot.origin_location,
            harvest_date: lot.harvest_date,
            created_at: lot.created_at,
            attributes,
            trust_score: trust?.trust_score || 0,
            verification_count: trust?.verification_count || 0,
            last_verified_at: trust?.last_verified_at || null,
          };
        })
      );

      return {
        success: true,
        data: lots,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Error al obtener lotes del productor",
      };
    }
  },
};
