/**
 * ⚠️ DEPRECATED - batchService.ts
 * 
 * Este archivo está DEPRECADO desde Stage 1 (27 de marzo, 2026).
 * 
 * RAZÓN: Reemplazado por lotService.ts, trackingService.ts y verificationService.ts
 * que implementan el nuevo schema normalizado (lots, lot_attributes, lot_events, trust_states).
 * 
 * MIGRACIÓN:
 * - saveBatchToDatabase() → lotService.createLot()
 * - getAllBatches() → lotService.getAllLots()
 * - getBatchById() → lotService.getLotByLotId()
 * 
 * TIMELINE DE ELIMINACIÓN:
 * - Sprint actual: Mantener para compatibilidad
 * - Sprint +1: Marcar como @deprecated en imports
 * - Sprint +2: Eliminar completamente
 * 
 * TICKET: STAGE1-CLEANUP-001
 * 
 * ❌ NO USAR EN CÓDIGO NUEVO
 * ✅ USAR: lotService, trackingService, verificationService
 */

import { lotService } from "./lotService";
import { toast } from "sonner";

export interface BatchRecord {
  batch_id: string;
  producer_name: string;
  location: string;
  variety: string;
  quality: string;
  transaction_hash: string;
  wallet_address?: string;
  metadata?: Record<string, any>;
  total_kg?: number;
  price_per_kg?: number;
  is_listed?: boolean;
}

/**
 * @deprecated Usar lotService.createLot() en su lugar
 * 
 * Wrapper que redirecciona a lotService para compatibilidad temporal.
 * Será eliminado en Stage 2.
 */
export const saveBatchToDatabase = async (batchData: BatchRecord) => {
  console.warn(
    "⚠️ DEPRECATED: saveBatchToDatabase() está deprecado. Usa lotService.createLot() en su lugar."
  );

  try {
    // Convertir BatchRecord a CreateLotPayload
    const payload = {
      lot_id: batchData.batch_id,
      producer_id: "", // Será obtenido del contexto en lotService
      origin_location: batchData.location,
      attributes: {
        variety: batchData.variety,
        quality: batchData.quality,
        total_kg: batchData.total_kg?.toString() || null,
        price_per_kg: batchData.price_per_kg?.toString() || null,
        is_listed: batchData.is_listed ? "true" : "false",
        wallet_address: batchData.wallet_address || null,
      },
    };

    // Llamar a lotService
    const result = await lotService.createLot(payload);

    if (!result.success) {
      const msg = result.error?.includes("unique") 
        ? "El ID de lote ya existe." 
        : "Error al guardar el lote. Inténtalo de nuevo.";
      toast.error(msg);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Exception en saveBatchToDatabase (deprecated):", error);
    toast.error("Error al guardar el lote");
    return { success: false, error };
  }
};

/**
 * @deprecated Usar lotService.getAllLots() en su lugar
 */
export const getAllBatches = async () => {
  console.warn(
    "⚠️ DEPRECATED: getAllBatches() está deprecado. Usa lotService.getAllLots() en su lugar."
  );

  try {
    const result = await lotService.getAllLots(100, 0);
    if (result.success) {
      return { success: true, data: result.data || [] };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error("Exception en getAllBatches (deprecated):", error);
    return { success: false, data: [] };
  }
};

/**
 * @deprecated Usar lotService.getLotByLotId() en su lugar
 */
export const getBatchById = async (batchId: string) => {
  console.warn(
    "⚠️ DEPRECATED: getBatchById() está deprecado. Usa lotService.getLotByLotId() en su lugar."
  );

  try {
    const result = await lotService.getLotByLotId(batchId);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, data: null };
  } catch (error) {
    console.error("Exception en getBatchById (deprecated):", error);
    return { success: false, data: null };
  }
};
