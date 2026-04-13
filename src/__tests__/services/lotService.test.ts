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

import { lotService } from "@/services/lotService";

describe("lotService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateLotIdFormat", () => {
    it("accepts valid lot_id: MG-2026-001", () => {
      expect(lotService.validateLotIdFormat("MG-2026-001")).toBe(true);
    });

    it("accepts valid lot_id: MANG-2026-000123", () => {
      expect(lotService.validateLotIdFormat("MANG-2026-000123")).toBe(true);
    });

    it("rejects lowercase lot_id", () => {
      expect(lotService.validateLotIdFormat("mg-2026-001")).toBe(false);
    });

    it("rejects missing year segment", () => {
      expect(lotService.validateLotIdFormat("MG-001")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(lotService.validateLotIdFormat("")).toBe(false);
    });

    it("rejects free-form string", () => {
      expect(lotService.validateLotIdFormat("invalid-id")).toBe(false);
    });

    it("rejects single-letter prefix", () => {
      expect(lotService.validateLotIdFormat("M-2026-001")).toBe(false);
    });
  });

  describe("createLot", () => {
    it("returns error for invalid lot_id format", async () => {
      const result = await lotService.createLot({
        lot_id: "bad-id",
        producer_id: "test-uuid",
        origin_location: "Piura",
        attributes: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Formato de lot_id inválido");
    });

    it("returns error when lot_id already exists", async () => {
      // Mock lotIdExists → true
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "existing-uuid" }, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await lotService.createLot({
        lot_id: "MG-2026-001",
        producer_id: "test-uuid",
        origin_location: "Piura",
        attributes: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("lot_id ya existe");
    });

    it("returns success when RPC succeeds", async () => {
      // Mock lotIdExists → false (first from call)
      const lotCheckChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      // Mock producerExists → true (second from call)
      const producerCheckChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "test-uuid" }, error: null }),
      };

      mockFrom
        .mockReturnValueOnce(lotCheckChain)
        .mockReturnValueOnce(producerCheckChain);

      mockRpc.mockResolvedValue({
        data: [{ lot_uuid: "new-uuid", lot_lot_id: "MG-2026-001" }],
        error: null,
      });

      const result = await lotService.createLot({
        lot_id: "MG-2026-001",
        producer_id: "test-uuid",
        origin_location: "Piura",
        attributes: { variety: "Kent", quality: "Premium" },
      });

      expect(result.success).toBe(true);
      expect(result.data?.lot_id).toBe("MG-2026-001");
      expect(result.data?.lot_uuid).toBe("new-uuid");
    });

    it("returns error when producer does not exist", async () => {
      const lotCheckChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      const producerCheckChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockFrom
        .mockReturnValueOnce(lotCheckChain)
        .mockReturnValueOnce(producerCheckChain);

      const result = await lotService.createLot({
        lot_id: "MG-2026-002",
        producer_id: "nonexistent-uuid",
        origin_location: "Ica",
        attributes: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("productor no existe");
    });
  });

  describe("getLotByLotId", () => {
    it("returns lot data when found", async () => {
      const mockLot = {
        lot_uuid: "uuid-123",
        lot_id: "MG-2026-001",
        producer_id: "prod-uuid",
        origin_location: "Piura",
        attributes: { variety: "Kent" },
        trust_score: 10,
      };

      mockRpc.mockResolvedValue({ data: [mockLot], error: null });

      const result = await lotService.getLotByLotId("MG-2026-001");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLot);
    });

    it("returns error when lot not found", async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      const result = await lotService.getLotByLotId("MG-2026-999");

      expect(result.success).toBe(false);
      expect(result.error).toContain("no encontrado");
    });

    it("returns error on RPC failure", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "RPC timeout" },
      });

      const result = await lotService.getLotByLotId("MG-2026-001");

      expect(result.success).toBe(false);
      expect(result.error).toBe("RPC timeout");
    });
  });
});
