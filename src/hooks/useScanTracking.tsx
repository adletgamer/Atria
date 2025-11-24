import { useState, useEffect } from "react";

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

const STORAGE_KEY = "mango_scan_events";

export const useScanTracking = () => {
    const [scans, setScans] = useState<ScanEvent[]>([]);

    // Load scans from localStorage on mount
    useEffect(() => {
        const loadScans = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    setScans(JSON.parse(stored));
                } catch (error) {
                    console.error("Error loading scans:", error);
                    setScans([]);
                }
            }
        };
        loadScans();

        // Listen for storage events to sync across tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                setScans(JSON.parse(e.newValue));
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Log a new scan event
    const logScan = (batchId: string, verified: boolean = true) => {
        const newScan: ScanEvent = {
            batchId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            verified,
        };

        const updatedScans = [newScan, ...scans];
        setScans(updatedScans);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScans));
    };

    // Get aggregated statistics
    const getScanStats = (): ScanStats => {
        const uniqueBatches = new Set(scans.map((s) => s.batchId)).size;

        // Count scans per batch
        const scansPerBatch: { [key: string]: number } = {};
        scans.forEach((scan) => {
            scansPerBatch[scan.batchId] = (scansPerBatch[scan.batchId] || 0) + 1;
        });

        // Count scans per day (last 7 days)
        const scansPerDay: { [key: string]: number } = {};
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split("T")[0];
        });

        last7Days.forEach((day) => {
            scansPerDay[day] = 0;
        });

        scans.forEach((scan) => {
            const day = scan.timestamp.split("T")[0];
            if (scansPerDay.hasOwnProperty(day)) {
                scansPerDay[day]++;
            }
        });

        return {
            totalScans: scans.length,
            uniqueBatches,
            recentScans: scans.slice(0, 10), // Last 10 scans
            scansPerBatch,
            scansPerDay,
        };
    };

    // Get recent scans with limit
    const getRecentScans = (limit: number = 5) => {
        return scans.slice(0, limit);
    };

    // Get scans for specific batch
    const getBatchScans = (batchId: string) => {
        return scans.filter((scan) => scan.batchId === batchId);
    };

    return {
        logScan,
        getScanStats,
        getRecentScans,
        getBatchScans,
        scans,
    };
};

export default useScanTracking;
