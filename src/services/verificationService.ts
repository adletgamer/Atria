/**
 * verificationService.ts
 * Servicio para gestión de verificaciones QR
 * Reemplaza useScanTracking hook (localStorage)
 */

import { supabase } from "@/integrations/supabase/client";
import type { ServiceResult, QRVerification } from "@/types/lot.types";
import { EVENT_TYPES, EVENT_CATEGORIES } from "@/types/lot.types";
import { trackingService } from "./trackingService";

export interface CreateVerificationPayload {
  lot_id: string; // lot_id string (no UUID)
  device_fingerprint?: string;
  location_data?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  ip_address?: string;
  user_agent?: string;
  success?: boolean;
  metadata?: Record<string, any>;
}

export const verificationService = {
  /**
   * Registra una verificación QR
   * Actualiza automáticamente trust_state vía trigger
   */
  async createVerification(
    payload: CreateVerificationPayload
  ): Promise<ServiceResult<QRVerification>> {
    try {
      // Obtener UUID del lote
      const { data: lot } = await supabase
        .from("lots")
        .select("id")
        .eq("lot_id", payload.lot_id)
        .single();

      if (!lot) {
        return {
          success: false,
          error: "Lote no encontrado",
        };
      }

      // Insertar verificación
      const { data, error } = await supabase
        .from("qr_verifications")
        .insert({
          lot_id: lot.id,
          device_fingerprint: payload.device_fingerprint || null,
          location_data: payload.location_data || null,
          ip_address: payload.ip_address || null,
          user_agent: payload.user_agent || null,
          success: payload.success ?? true,
          metadata: payload.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error("Error en createVerification:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Crear evento de tracking (solo si fue exitoso)
      if (payload.success !== false) {
        await trackingService.createEvent({
          lot_id: lot.id,
          event_type: EVENT_TYPES.QR_SCANNED,
          event_category: EVENT_CATEGORIES.VERIFICATION,
          description: "Código QR escaneado",
          location: payload.location_data
            ? `${payload.location_data.latitude},${payload.location_data.longitude}`
            : null,
          metadata: {
            device_fingerprint: payload.device_fingerprint,
            ip_address: payload.ip_address,
          },
        });
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("Exception en createVerification:", error);
      return {
        success: false,
        error: error.message || "Error al registrar verificación",
      };
    }
  },

  /**
   * Obtiene todas las verificaciones de un lote
   */
  async getLotVerifications(
    lotId: string
  ): Promise<ServiceResult<QRVerification[]>> {
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
        .from("qr_verifications")
        .select("*")
        .eq("lot_id", lot.id)
        .order("verified_at", { ascending: false });

      if (error) {
        console.error("Error en getLotVerifications:", error);
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
      console.error("Exception en getLotVerifications:", error);
      return {
        success: false,
        error: error.message || "Error al obtener verificaciones",
      };
    }
  },

  /**
   * Obtiene estadísticas de verificaciones de un lote
   */
  async getLotVerificationStats(lotId: string): Promise<
    ServiceResult<{
      total_scans: number;
      successful_scans: number;
      unique_devices: number;
      last_scan_at: string | null;
      scans_by_day: Record<string, number>;
    }>
  > {
    try {
      const result = await this.getLotVerifications(lotId);

      if (!result.success || !result.data) {
        return result as any;
      }

      const verifications = result.data;
      const uniqueDevices = new Set(
        verifications
          .map((v) => v.device_fingerprint)
          .filter((d) => d !== null)
      );

      const scansByDay = verifications.reduce(
        (acc: Record<string, number>, v) => {
          const day = new Date(v.verified_at).toISOString().split("T")[0];
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        },
        {}
      );

      return {
        success: true,
        data: {
          total_scans: verifications.length,
          successful_scans: verifications.filter((v) => v.success).length,
          unique_devices: uniqueDevices.size,
          last_scan_at:
            verifications.length > 0 ? verifications[0].verified_at : null,
          scans_by_day: scansByDay,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Error al obtener estadísticas",
      };
    }
  },

  /**
   * Detecta escaneos sospechosos (mismo device, múltiples veces)
   */
  async detectSuspiciousScans(lotId: string): Promise<
    ServiceResult<{
      suspicious: boolean;
      reasons: string[];
      details: any[];
    }>
  > {
    try {
      const result = await this.getLotVerifications(lotId);

      if (!result.success || !result.data) {
        return result as any;
      }

      const verifications = result.data;
      const reasons: string[] = [];
      const details: any[] = [];

      // Detectar múltiples escaneos del mismo device
      const deviceCounts = verifications.reduce(
        (acc: Record<string, number>, v) => {
          if (v.device_fingerprint) {
            acc[v.device_fingerprint] = (acc[v.device_fingerprint] || 0) + 1;
          }
          return acc;
        },
        {}
      );

      Object.entries(deviceCounts).forEach(([device, count]) => {
        if (count > 5) {
          reasons.push(`Dispositivo ${device} escaneó ${count} veces`);
          details.push({ device, count, type: "multiple_scans" });
        }
      });

      // Detectar escaneos muy rápidos (< 1 segundo entre escaneos)
      for (let i = 1; i < verifications.length; i++) {
        const prev = new Date(verifications[i - 1].verified_at);
        const curr = new Date(verifications[i].verified_at);
        const diffMs = Math.abs(prev.getTime() - curr.getTime());

        if (diffMs < 1000) {
          reasons.push("Escaneos muy rápidos detectados");
          details.push({
            time_diff_ms: diffMs,
            type: "rapid_scans",
          });
          break; // Solo reportar una vez
        }
      }

      return {
        success: true,
        data: {
          suspicious: reasons.length > 0,
          reasons,
          details,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Error al detectar escaneos sospechosos",
      };
    }
  },

  /**
   * Genera fingerprint del dispositivo (cliente)
   * Esta función se usa en el frontend
   */
  generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
    ];

    const fingerprint = components.join("|");
    return this.simpleHash(fingerprint);
  },

  /**
   * Hash simple para fingerprint
   */
  simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  },

  /**
   * Obtiene geolocalización (si el usuario lo permite)
   */
  async getGeolocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        () => {
          resolve(null);
        },
        {
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  },
};
