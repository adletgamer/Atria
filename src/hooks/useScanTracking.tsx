/**
 * ⚠️ DEPRECATED - useScanTracking.tsx
 * 
 * Este hook está DEPRECADO desde Stage 1 (27 de marzo, 2026).
 * 
 * RAZÓN: localStorage ha sido eliminado. Todas las verificaciones se guardan en DB.
 * 
 * MIGRACIÓN:
 * - logScan() → verificationService.createVerification()
 * - getScanStats() → verificationService.getLotVerificationStats()
 * - getBatchScans() → verificationService.getLotVerifications()
 * 
 * TIMELINE DE ELIMINACIÓN:
 * - Sprint actual: Mantener para compatibilidad
 * - Sprint +1: Eliminar completamente
 * 
 * TICKET: STAGE1-CLEANUP-002
 * 
 * ❌ NO USAR EN CÓDIGO NUEVO
 * ✅ USAR: verificationService
 */

import { verificationService } from "@/services/verificationService";

export interface ScanEvent {
    batchId: string;
    timestamp: string;
    userAgent: string;
    verified: boolean;
}

export interface ScanStats {
    totalScans: number;
    uniqueBatches: number;
    recentScans: ScanEvent[];
    scansPerBatch: { [key: string]: number };
    scansPerDay: { [key: string]: number };
}

/**
 * @deprecated Usar verificationService.createVerification() en su lugar
 * 
 * Este hook ha sido reemplazado por verificationService que persiste
 * todas las verificaciones en Supabase en lugar de localStorage.
 */
export const useScanTracking = () => {
    console.warn(
        "⚠️ DEPRECATED: useScanTracking hook está deprecado. Usa verificationService en su lugar."
    );

    // Stub implementation para compatibilidad temporal
    const logScan = async (batchId: string, verified: boolean = true) => {
        console.warn(
            "⚠️ DEPRECATED: logScan() está deprecado. Usa verificationService.createVerification() en su lugar."
        );

        if (verified) {
            await verificationService.createVerification({
                lot_id: batchId,
                success: true,
                user_agent: navigator.userAgent,
                device_fingerprint: verificationService.generateDeviceFingerprint(),
            });
        } else {
            await verificationService.createVerification({
                lot_id: batchId,
                success: false,
                metadata: { reason: "verification_failed" },
            });
        }
    };

    const getScanStats = (): ScanStats => {
        console.warn(
            "⚠️ DEPRECATED: getScanStats() está deprecado. Usa verificationService.getLotVerificationStats() en su lugar."
        );

        return {
            totalScans: 0,
            uniqueBatches: 0,
            recentScans: [],
            scansPerBatch: {},
            scansPerDay: {},
        };
    };

    const getRecentScans = (limit: number = 5) => {
        console.warn(
            "⚠️ DEPRECATED: getRecentScans() está deprecado. Usa verificationService.getLotVerifications() en su lugar."
        );
        return [];
    };

    const getBatchScans = (batchId: string) => {
        console.warn(
            "⚠️ DEPRECATED: getBatchScans() está deprecado. Usa verificationService.getLotVerifications() en su lugar."
        );
        return [];
    };

    return {
        logScan,
        getScanStats,
        getRecentScans,
        getBatchScans,
        scans: [],
    };
};

export default useScanTracking;
