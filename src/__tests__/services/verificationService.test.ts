import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRpc, mockFrom } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));

import { verificationService } from "@/services/verificationService";

describe("verificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLotVerifications", () => {
    it("returns verifications for a lot", async () => {
      // Mock lot lookup
      const lotChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "uuid-1" },
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(lotChain);

      // Mock verifications query
      const verifChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "v-1",
              lot_id: "uuid-1",
              device_fingerprint: "device-001",
              success: true,
              created_at: "2026-03-16T14:00:00Z",
            },
          ],
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(verifChain);

      const result = await verificationService.getLotVerifications("MG-2026-001");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].success).toBe(true);
    });
  });

  describe("getLotVerificationStats", () => {
    it("returns stats for a lot", async () => {
      // getLotVerificationStats calls getLotVerifications internally
      // Mock lot lookup (for getLotVerifications)
      const lotChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "uuid-1" },
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(lotChain);

      // Mock qr_verifications query (for getLotVerifications)
      const verifChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: "v-1", device_fingerprint: "dev-1", success: true, verified_at: "2026-03-16T14:00:00Z" },
            { id: "v-2", device_fingerprint: "dev-2", success: true, verified_at: "2026-03-16T15:00:00Z" },
          ],
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(verifChain);

      const result = await verificationService.getLotVerificationStats("MG-2026-001");

      expect(result.success).toBe(true);
      expect(result.data?.total_scans).toBe(2);
      expect(result.data?.successful_scans).toBe(2);
      expect(result.data?.unique_devices).toBe(2);
    });
  });

  describe("generateDeviceFingerprint", () => {
    it("returns a non-empty string", () => {
      const fingerprint = verificationService.generateDeviceFingerprint();
      expect(typeof fingerprint).toBe("string");
      expect(fingerprint.length).toBeGreaterThan(0);
    });
  });
});
