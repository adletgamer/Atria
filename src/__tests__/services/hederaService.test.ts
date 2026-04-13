/**
 * hederaService.test.ts
 * Tests for the Hedera anchoring layer
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockLt = vi.fn();

const chainable = () => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
  in: mockIn,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  lt: mockLt,
});

// Make each method return the chainable
for (const fn of [mockSelect, mockInsert, mockUpdate, mockEq, mockIn, mockOrder, mockLimit, mockLt]) {
  fn.mockReturnValue(chainable());
}

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(() => chainable()),
  rpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock hedera config
const { mockIsHederaConfigured } = vi.hoisted(() => ({
  mockIsHederaConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock("@/config/hedera", () => ({
  hederaConfig: {
    network: "testnet",
    topicId: "0.0.12345",
    operatorId: "0.0.67890",
    operatorKey: "mock-key",
    mirrorNodeUrl: "https://testnet.mirrornode.hedera.com",
  },
  isHederaConfigured: mockIsHederaConfigured,
  getHashScanUrl: (txId: string) => `https://hashscan.io/testnet/transaction/${txId}`,
  getTopicHashScanUrl: () => "https://hashscan.io/testnet/topic/0.0.12345",
  getMirrorNodeMessageUrl: (seq: number) => `https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.12345/messages/${seq}`,
}));

// Mock evidence service
vi.mock("@/services/evidenceService", () => ({
  evidenceService: {
    generateEvidencePack: vi.fn().mockResolvedValue({
      success: true,
      data: {
        consignment_id: "test-consignment-1",
        case_number: "CS-2026-001",
        version: 1,
        generated_at: "2026-04-06T00:00:00Z",
        root_hash: "abc123def456",
        input_hashes: ["hash1", "hash2", "hash3"],
        anchor: null,
        state_snapshot: { current_state: "ready", readiness: "ready", risk_status: "low" },
        evidence_count: 3,
        attestation_count: 2,
        handoff_count: 4,
        exception_summary: { total: 0, open: 0, blocking: 0 },
      },
    }),
    sha256: vi.fn().mockResolvedValue("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
  },
}));

// Mock @hashgraph/sdk — needs to handle dynamic import() inside the service
const mockExecute = vi.fn().mockResolvedValue({
  getReceipt: vi.fn().mockResolvedValue({
    topicSequenceNumber: { toNumber: () => 42 },
  }),
  transactionId: { toString: () => "0.0.67890@1234567890.123" },
});

vi.mock("@hashgraph/sdk", () => {
  const mockClient = {
    setOperator: vi.fn(),
    close: vi.fn(),
  };
  return {
    Client: {
      forTestnet: () => mockClient,
      forMainnet: () => mockClient,
    },
    TopicMessageSubmitTransaction: vi.fn().mockImplementation(() => ({
      setTopicId: vi.fn().mockReturnThis(),
      setMessage: vi.fn().mockReturnThis(),
      execute: mockExecute,
    })),
    TopicId: { fromString: vi.fn() },
    AccountId: { fromString: vi.fn() },
    PrivateKey: {
      fromStringED25519: vi.fn().mockReturnValue({ publicKey: "mock-pub-key" }),
    },
  };
});

import { hederaService } from "@/services/hederaService";

describe("hederaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computePackHash", () => {
    it("should compute SHA-256 of evidence pack", async () => {
      const result = await hederaService.computePackHash("test-consignment-1");

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.packHash).toBeTruthy();
      expect(result.data!.inputHashes).toHaveLength(3);
      expect(result.data!.evidenceCount).toBe(3);
      expect(result.data!.attestationCount).toBe(2);
    });
  });

  describe("submitToHCS", () => {
    // NOTE: Actual HCS submission with the Hedera SDK is an integration test.
    // Dynamic import("@hashgraph/sdk") inside the service doesn't resolve the
    // same vi.mock in Vitest's module graph. Test the guard logic here.

    it("should return error when Hedera is not configured", async () => {
      // Temporarily override the mock to return false
      mockIsHederaConfigured.mockReturnValueOnce(false);

      const payload = {
        type: "evidence_pack_anchor" as const,
        consignment_id: "test-consignment-1",
        case_number: "CS-2026-001",
        pack_hash: "abc123",
        pack_version: 1,
        evidence_count: 3,
        attestation_count: 2,
        input_hash_count: 3,
        merkle_root: "abc123",
        anchored_by: "system",
        timestamp: new Date().toISOString(),
      };

      const result = await hederaService.submitToHCS(payload);

      expect(result.success).toBe(false);
      expect(result.error).toContain("not configured");
    });
  });

  describe("anchorEvidencePack", () => {
    it("should prevent double-anchoring same version", async () => {
      // Mock: existing anchored proof for same version
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: "existing-proof", status: "anchored" },
        error: null,
      });

      const result = await hederaService.anchorEvidencePack({
        consignment_id: "test-consignment-1",
        case_number: "CS-2026-001",
        pack_hash: "abc123",
        pack_version: 1,
        input_hashes: ["hash1"],
        evidence_count: 1,
        attestation_count: 0,
        anchored_by: "system",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already anchored");
    });

    it("should create trust proof and submit to Hedera", async () => {
      // Mock: no existing proof
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      // Mock: insert trust_proof
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "new-proof-id",
          consignment_id: "test-consignment-1",
          pack_hash: "abc123",
          pack_version: 1,
          status: "pending",
        },
        error: null,
      });

      // Mock: update after Hedera success
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "new-proof-id",
          consignment_id: "test-consignment-1",
          pack_hash: "abc123",
          pack_version: 1,
          status: "anchored",
          topic_id: "0.0.12345",
          sequence_number: 42,
          transaction_id: "0.0.67890@1234567890.123",
        },
        error: null,
      });

      const result = await hederaService.anchorEvidencePack({
        consignment_id: "test-consignment-1",
        case_number: "CS-2026-001",
        pack_hash: "abc123",
        pack_version: 1,
        input_hashes: ["hash1", "hash2"],
        evidence_count: 2,
        attestation_count: 1,
        anchored_by: "system",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe("getConsignmentProofs", () => {
    it("should return proofs for a consignment", async () => {
      const mockProofs = [
        { id: "proof-1", pack_version: 2, status: "anchored" },
        { id: "proof-2", pack_version: 1, status: "anchored" },
      ];

      mockOrder.mockReturnValueOnce({ data: mockProofs, error: null });

      const result = await hederaService.getConsignmentProofs("test-consignment-1");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe("getLatestProof", () => {
    it("should return null when no proofs exist", async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await hederaService.getLatestProof("test-consignment-1");

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });
});
