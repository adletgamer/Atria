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

import { trackingService } from "@/services/trackingService";

describe("trackingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLotTimeline", () => {
    it("returns timeline events when lot exists", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          lot_id: "uuid-1",
          event_type: "lot.created",
          event_category: "lifecycle",
          description: "Lote creado",
          occurred_at: "2026-03-15T10:00:00Z",
        },
        {
          id: "evt-2",
          lot_id: "uuid-1",
          event_type: "verification.completed",
          event_category: "verification",
          description: "Verificación QR",
          occurred_at: "2026-03-16T14:00:00Z",
        },
      ];

      mockRpc.mockResolvedValue({ data: mockEvents, error: null });

      const result = await trackingService.getLotTimeline("MG-2026-001");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].event_type).toBe("lot.created");
      expect(mockRpc).toHaveBeenCalledWith("get_lot_timeline", {
        p_lot_id: "MG-2026-001",
      });
    });

    it("returns error on RPC failure", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "Function not found" },
      });

      const result = await trackingService.getLotTimeline("MG-2026-001");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Function not found");
    });
  });

  describe("createEvent", () => {
    it("creates event successfully", async () => {
      // createEvent calls supabase.from("lot_events").insert({...})
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockFrom.mockReturnValueOnce(insertChain);

      const result = await trackingService.createEvent({
        lot_id: "uuid-1",
        event_type: "custody.transfer",
        event_category: "custody",
        description: "Transferred to warehouse",
      });

      expect(result.success).toBe(true);
      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          lot_id: "uuid-1",
          event_type: "custody.transfer",
          event_category: "custody",
        })
      );
    });

    it("returns error on insert failure", async () => {
      const insertChain = {
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Foreign key violation" },
        }),
      };
      mockFrom.mockReturnValueOnce(insertChain);

      const result = await trackingService.createEvent({
        lot_id: "nonexistent-uuid",
        event_type: "custody.transfer",
        event_category: "custody",
        description: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Foreign key violation");
    });
  });
});
