/**
 * dashboardService.ts
 * Servicio para agregaciones y estadísticas del dashboard
 * Reemplaza cálculos en Dashboard.tsx
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { ServiceResult } from "@/types/lot.types";

export interface DashboardStats {
  total_lots: number;
  total_producers: number;
  total_verifications: number;
  total_kg: number;
  avg_price: number;
  avg_trust_score: number;
  evidence_completeness: number;
  custody_continuity: number;
}

export interface QualityDistribution {
  quality: string;
  count: number;
  percentage: number;
}

export interface LocationDistribution {
  location: string;
  count: number;
  percentage: number;
}

export interface AnchoringStats {
  total_proofs: number;
  anchored_count: number;
  verified_count: number;
  pending_count: number;
  failed_count: number;
  last_anchored_at: string | null;
}

export const dashboardService = {
  /**
   * Obtiene estadísticas generales del dashboard
   */
  async getDashboardStats(): Promise<ServiceResult<DashboardStats>> {
    try {
      // Query optimizado con agregaciones en DB
      const { data: lots, error: lotsError } = await supabase
        .from("lots")
        .select(
          `
          id,
          producer_id,
          lot_attributes!inner(attribute_key, attribute_value)
        `
        );

      if (lotsError) {
        logger.error("dashboard.stats_failed", {}, lotsError);
        return {
          success: false,
          error: lotsError.message,
        };
      }

      // Obtener trust states
      const { data: trustStates } = await supabase
        .from("trust_states")
        .select("trust_score, verification_count");

      // Calcular productores únicos
      const uniqueProducers = new Set(
        (lots || []).map((l: any) => l.producer_id).filter((id) => id !== null)
      );

      // Calcular kg totales y precio promedio
      let totalKg = 0;
      let totalPrice = 0;
      let priceCount = 0;

      (lots || []).forEach((lot: any) => {
        const kgAttr = lot.lot_attributes?.find(
          (a: any) => a.attribute_key === "total_kg"
        );
        const priceAttr = lot.lot_attributes?.find(
          (a: any) => a.attribute_key === "price_per_kg"
        );

        if (kgAttr) {
          totalKg += parseFloat(kgAttr.attribute_value) || 0;
        }
        if (priceAttr) {
          totalPrice += parseFloat(priceAttr.attribute_value) || 0;
          priceCount++;
        }
      });

      // Calcular verificaciones totales y trust score promedio
      const totalVerifications = (trustStates || []).reduce(
        (sum, ts: any) => sum + (ts.verification_count || 0),
        0
      );

      const avgTrustScore =
        (trustStates || []).length > 0
          ? (trustStates || []).reduce(
              (sum, ts: any) => sum + (ts.trust_score || 0),
              0
            ) / (trustStates || []).length
          : 0;

      // Compute evidence completeness: % of lots with ≥3 key attributes (variety, quality, total_kg)
      const REQUIRED_ATTRS = ['variety', 'quality', 'total_kg'];
      let completeLots = 0;
      (lots || []).forEach((lot: any) => {
        const keys = (lot.lot_attributes || []).map((a: any) => a.attribute_key);
        const present = REQUIRED_ATTRS.filter((k) => keys.includes(k)).length;
        if (present >= REQUIRED_ATTRS.length) completeLots++;
      });
      const evidenceCompleteness = (lots || []).length > 0
        ? Math.round((completeLots / (lots || []).length) * 100)
        : 0;

      // Compute custody continuity: % of lots that have ≥2 events (created + at least one more)
      const { data: eventCounts } = await supabase
        .from('lot_events')
        .select('lot_id');
      const eventsPerLot: Record<string, number> = {};
      (eventCounts || []).forEach((e: any) => {
        eventsPerLot[e.lot_id] = (eventsPerLot[e.lot_id] || 0) + 1;
      });
      const lotsWithContinuity = (lots || []).filter(
        (lot: any) => (eventsPerLot[lot.id] || 0) >= 2
      ).length;
      const custodyContinuity = (lots || []).length > 0
        ? Math.round((lotsWithContinuity / (lots || []).length) * 100)
        : 0;

      return {
        success: true,
        data: {
          total_lots: (lots || []).length,
          total_producers: uniqueProducers.size,
          total_verifications: totalVerifications,
          total_kg: Math.round(totalKg * 100) / 100,
          avg_price: priceCount > 0 ? Math.round((totalPrice / priceCount) * 100) / 100 : 0,
          avg_trust_score: Math.round(avgTrustScore * 100) / 100,
          evidence_completeness: evidenceCompleteness,
          custody_continuity: custodyContinuity,
        },
      };
    } catch (error: any) {
      logger.error("dashboard.stats_exception", {}, error);
      return {
        success: false,
        error: error.message || "Error al obtener estadísticas",
      };
    }
  },

  /**
   * Obtiene distribución por calidad
   */
  async getQualityDistribution(): Promise<ServiceResult<QualityDistribution[]>> {
    try {
      const { data, error } = await supabase
        .from("lot_attributes")
        .select("attribute_value")
        .eq("attribute_key", "quality");

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const qualities = data || [];
      const total = qualities.length;

      // Agrupar y contar
      const counts = qualities.reduce((acc: Record<string, number>, item: any) => {
        const quality = item.attribute_value;
        acc[quality] = (acc[quality] || 0) + 1;
        return acc;
      }, {});

      const distribution = Object.entries(counts).map(([quality, count]) => ({
        quality,
        count: count as number,
        percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0,
      }));

      return {
        success: true,
        data: distribution,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Error al obtener distribución de calidad",
      };
    }
  },

  /**
   * Obtiene distribución por ubicación
   */
  async getLocationDistribution(): Promise<ServiceResult<LocationDistribution[]>> {
    try {
      const { data, error } = await supabase
        .from("lots")
        .select("origin_location");

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const locations = data || [];
      const total = locations.length;

      // Agrupar y contar
      const counts = locations.reduce((acc: Record<string, number>, item: any) => {
        const location = item.origin_location;
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {});

      const distribution = Object.entries(counts).map(([location, count]) => ({
        location,
        count: count as number,
        percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0,
      }));

      // Ordenar por count descendente
      distribution.sort((a, b) => b.count - a.count);

      return {
        success: true,
        data: distribution,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Error al obtener distribución de ubicación",
      };
    }
  },

  /**
   * Obtiene lotes recientes para el dashboard
   */
  async getRecentLots(limit: number = 6): Promise<ServiceResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from("lots")
        .select(
          `
          id,
          lot_id,
          origin_location,
          created_at,
          profiles!lots_producer_id_fkey(full_name),
          trust_states(trust_score, verification_count)
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Enriquecer con atributos
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

          return {
            lot_id: lot.lot_id,
            producer_name: lot.profiles?.full_name || "Desconocido",
            location: lot.origin_location,
            variety: attributes.variety || "-",
            quality: attributes.quality || "-",
            total_kg: attributes.total_kg || null,
            price_per_kg: attributes.price_per_kg || null,
            trust_score: lot.trust_states?.trust_score || 0,
            verification_count: lot.trust_states?.verification_count || 0,
            created_at: lot.created_at,
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
        error: error.message || "Error al obtener lotes recientes",
      };
    }
  },

  /**
   * Obtiene estadísticas de un productor específico
   */
  async getProducerStats(producerId: string): Promise<
    ServiceResult<{
      total_lots: number;
      total_kg: number;
      avg_trust_score: number;
      total_verifications: number;
    }>
  > {
    try {
      const { data: lots, error } = await supabase
        .from("lots")
        .select(
          `
          id,
          trust_states(trust_score, verification_count)
        `
        )
        .eq("producer_id", producerId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Obtener kg totales
      const lotIds = (lots || []).map((l: any) => l.id);
      const { data: kgAttrs } = await supabase
        .from("lot_attributes")
        .select("attribute_value")
        .in("lot_id", lotIds)
        .eq("attribute_key", "total_kg");

      const totalKg = (kgAttrs || []).reduce(
        (sum, attr: any) => sum + (parseFloat(attr.attribute_value) || 0),
        0
      );

      const trustScores = (lots || [])
        .map((l: any) => l.trust_states?.trust_score || 0)
        .filter((score) => score > 0);

      const avgTrustScore =
        trustScores.length > 0
          ? trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length
          : 0;

      const totalVerifications = (lots || []).reduce(
        (sum, l: any) => sum + (l.trust_states?.verification_count || 0),
        0
      );

      return {
        success: true,
        data: {
          total_lots: (lots || []).length,
          total_kg: Math.round(totalKg * 100) / 100,
          avg_trust_score: Math.round(avgTrustScore * 100) / 100,
          total_verifications: totalVerifications,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Error al obtener estadísticas del productor",
      };
    }
  },

  /**
   * Get anchoring statistics for the network health section.
   */
  async getAnchoringStats(): Promise<ServiceResult<AnchoringStats>> {
    try {
      const { data: proofs, error } = await supabase
        .from("trust_proofs")
        .select("status, anchored_at, consensus_timestamp");

      if (error) {
        return { success: false, error: error.message };
      }

      const all = proofs || [];
      const anchored = all.filter((p: any) => p.status === 'anchored' || p.status === 'verified');
      const verified = all.filter((p: any) => p.status === 'verified');
      const pending = all.filter((p: any) => p.status === 'pending' || p.status === 'pending_anchor');
      const failed = all.filter((p: any) => p.status === 'failed');

      return {
        success: true,
        data: {
          total_proofs: all.length,
          anchored_count: anchored.length,
          verified_count: verified.length,
          pending_count: pending.length,
          failed_count: failed.length,
          last_anchored_at: anchored.length > 0
            ? anchored.sort((a: any, b: any) => new Date(b.anchored_at).getTime() - new Date(a.anchored_at).getTime())[0].anchored_at
            : null,
        },
      };
    } catch (error: any) {
      logger.error("dashboard.getAnchoringStats_failed", {}, error);
      return { success: false, error: error.message };
    }
  },
};
