/**
 * exceptionService.test.ts
 * Unit tests for exception evaluation, resolution, and listing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRpc, mockFrom } = vi.hoisted(() => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn();
  return { mockRpc, mockFrom };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { exceptionService } from "@/services/exceptionService";

describe("exceptionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("evaluateConsignment", () => {
    it("returns evaluation results with exceptions and snapshot", async () => {
      // Mock evaluate RPC
      mockRpc.mockResolvedValueOnce({
        data: [
          {
            exception_id: "exc-1",
            exc_type: "doc_missing",
            severity: "blocking",
            title: "Missing required evidence: certificate",
            is_new: true,
          },
          {
            exception_id: "exc-2",
            exc_type: "regulatory_block",
            severity: "warning",
            title: "Missing attestation: export cleared",
            is_new: true,
          },
        ],
        error: null,
      });

      // Mock snapshot RPC
      mockRpc.mockResolvedValueOnce({
        data: "snap-uuid-123",
        error: null,
      });

      const result = await exceptionService.evaluateConsignment("case-1", "actor-1");

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.exceptions).toHaveLength(2);
      expect(result.data!.exceptions[0].exc_type).toBe("doc_missing");
      expect(result.data!.exceptions[1].is_new).toBe(true);
      expect(result.data!.snapshot_id).toBe("snap-uuid-123");
      expect(mockRpc).toHaveBeenCalledTimes(2);
      expect(mockRpc).toHaveBeenCalledWith("evaluate_consignment_exceptions", {
        p_consignment_id: "case-1",
        p_actor_id: "actor-1",
      });
    });

    it("returns error when evaluate RPC fails", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "RPC failed" },
      });

      const result = await exceptionService.evaluateConsignment("case-1", "actor-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("RPC failed");
    });

    it("succeeds even when snapshot creation fails", async () => {
      mockRpc.mockResolvedValueOnce({
        data: [
          {
            exception_id: "exc-1",
            exc_type: "doc_missing",
            severity: "blocking",
            title: "Missing cert",
            is_new: true,
          },
        ],
        error: null,
      });

      // Snapshot fails
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Snapshot creation failed" },
      });

      const result = await exceptionService.evaluateConsignment("case-1", "actor-1");

      expect(result.success).toBe(true);
      expect(result.data!.exceptions).toHaveLength(1);
      expect(result.data!.snapshot_id).toBeNull();
    });
  });

  describe("resolveException", () => {
    it("resolves an exception successfully", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await exceptionService.resolveException({
        exception_id: "exc-1",
        resolved_by: "actor-1",
        resolution: "Document uploaded",
      });

      expect(result.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("consignment_exceptions");
    });

    it("returns error when update fails", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
        }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await exceptionService.resolveException({
        exception_id: "exc-1",
        resolved_by: "actor-1",
        resolution: "Resolved",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });

  describe("getExceptions", () => {
    it("returns unresolved exceptions by default", async () => {
      // Chain: .select().eq().order() returns chainable, then .eq() resolves
      const mockEqResolved = vi.fn().mockResolvedValue({
        data: [
          { id: "exc-1", exc_type: "doc_missing", resolved: false, blocks_readiness: true },
          { id: "exc-2", exc_type: "customs_hold", resolved: false, blocks_readiness: true },
        ],
        error: null,
      });
      const mockOrder = vi.fn().mockReturnValue({ eq: mockEqResolved });
      const mockEq1 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await exceptionService.getExceptions("case-1");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("returns error on query failure", async () => {
      const mockEqResolved = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });
      const mockOrder = vi.fn().mockReturnValue({ eq: mockEqResolved });
      const mockEq1 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await exceptionService.getExceptions("case-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Query failed");
    });
  });

  describe("getBlockingExceptions", () => {
    it("returns only blocking unresolved exceptions", async () => {
      // Chain: .select().eq().eq().eq().order()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          { id: "exc-1", exc_type: "doc_missing", resolved: false, blocks_readiness: true },
        ],
        error: null,
      });
      const mockEq3 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await exceptionService.getBlockingExceptions("case-1");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].blocks_readiness).toBe(true);
    });
  });
});
