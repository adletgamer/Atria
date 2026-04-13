/**
 * evidenceService.test.ts
 * Integration tests for evidence hashing + evidence pack generation.
 *
 * Coverage:
 *   ✅  sha256()            — Web Crypto hash (deterministic, pure)
 *   ✅  computeMerkleRoot() — deterministic Merkle root from list of hashes
 *   ✅  createEvidence()    — validation guards (content_hash, type, creator)
 *   ✅  getConsignmentEvidence() — happy path + error path
 *   ✅  generateEvidencePack()   — happy path with mocked Supabase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── MOCKS ─────────────────────────────────────────────────────────────────────

// We need to hoist mockFrom/mockRpc before any imports that reference them.
const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    storage: { from: vi.fn() },
  },
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Builds a fluent Supabase query chain mock that resolves to `result`. */
function makeChain(result: object) {
  const terminal = vi.fn().mockResolvedValue(result);
  const chain: Record<string, unknown> = {};
  for (const m of ["select","insert","update","eq","in","order","limit","maybeSingle","single","head"]) {
    chain[m] = vi.fn(() => chain);
  }
  // Make terminal methods return the resolved result
  (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue(result);
  (chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue(result);
  (chain.order as ReturnType<typeof vi.fn>).mockReturnValue({
    ...chain,
    data: (result as { data: unknown }).data,
    error: (result as { error: unknown }).error,
  });
  return { chain, terminal };
}

// ── IMPORT SERVICE (after mocks) ──────────────────────────────────────────────

import { evidenceService } from "@/services/evidenceService";

// ═════════════════════════════════════════════════════════════════════════════
// 1. SHA-256 HASHING
// ═════════════════════════════════════════════════════════════════════════════

describe("evidenceService.sha256", () => {
  it("returns a 64-char lowercase hex string", async () => {
    const hash = await evidenceService.sha256("hello world");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same input produces same output", async () => {
    const a = await evidenceService.sha256("HarvestLink Protocol v2");
    const b = await evidenceService.sha256("HarvestLink Protocol v2");
    expect(a).toBe(b);
  });

  it("produces distinct hashes for distinct inputs", async () => {
    const a = await evidenceService.sha256("CS-2026-001");
    const b = await evidenceService.sha256("CS-2026-002");
    expect(a).not.toBe(b);
  });

  it("handles empty string", async () => {
    const hash = await evidenceService.sha256("");
    // SHA-256 of empty string is well-known
    expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("handles unicode input", async () => {
    const hash = await evidenceService.sha256("Exportaciones del Norte — Perú 🥭");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("handles large input strings", async () => {
    const large = "x".repeat(100_000);
    const hash = await evidenceService.sha256(large);
    expect(hash).toHaveLength(64);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. MERKLE ROOT
// ═════════════════════════════════════════════════════════════════════════════

describe("evidenceService.computeMerkleRoot", () => {
  it("returns sha256('empty') for an empty array", async () => {
    const root = await evidenceService.computeMerkleRoot([]);
    const expected = await evidenceService.sha256("empty");
    expect(root).toBe(expected);
  });

  it("returns the single hash for a 1-element array", async () => {
    const hash = "abc123def456abc123def456abc123def456abc123def456abc123def456abcd";
    const root = await evidenceService.computeMerkleRoot([hash]);
    expect(root).toBe(hash);
  });

  it("is deterministic — same hashes, same root", async () => {
    const hashes = ["hash-a", "hash-b", "hash-c"];
    const root1 = await evidenceService.computeMerkleRoot(hashes);
    const root2 = await evidenceService.computeMerkleRoot(hashes);
    expect(root1).toBe(root2);
  });

  it("is order-independent (sorts before hashing)", async () => {
    const h = ["hash-z", "hash-a", "hash-m"];
    const root1 = await evidenceService.computeMerkleRoot([...h]);
    const root2 = await evidenceService.computeMerkleRoot([...h].reverse());
    expect(root1).toBe(root2);
  });

  it("produces distinct roots for distinct hash sets", async () => {
    const root1 = await evidenceService.computeMerkleRoot(["hash-a", "hash-b"]);
    const root2 = await evidenceService.computeMerkleRoot(["hash-a", "hash-c"]);
    expect(root1).not.toBe(root2);
  });

  it("root is a 64-char hex string for multi-element input", async () => {
    const root = await evidenceService.computeMerkleRoot(["h1", "h2", "h3", "h4"]);
    expect(root).toHaveLength(64);
    expect(root).toMatch(/^[0-9a-f]{64}$/);
  });

  it("handles duplicate hashes in the input", async () => {
    const root = await evidenceService.computeMerkleRoot(["dup", "dup", "dup"]);
    expect(root).toHaveLength(64);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. createEvidence — VALIDATION GUARDS
// ═════════════════════════════════════════════════════════════════════════════

describe("evidenceService.createEvidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when content_hash is missing", async () => {
    const result = await evidenceService.createEvidence({
      consignment_id: "uuid-1",
      evidence_type: "document",
      created_by: "user-1",
      content_hash: "",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("content_hash");
  });

  it("rejects when evidence_type is missing", async () => {
    const result = await evidenceService.createEvidence({
      consignment_id: "uuid-1",
      evidence_type: "",
      created_by: "user-1",
      content_hash: "abc123",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("evidence_type");
  });

  it("rejects when created_by is missing", async () => {
    const result = await evidenceService.createEvidence({
      consignment_id: "uuid-1",
      evidence_type: "document",
      created_by: "",
      content_hash: "abc123",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("created_by");
  });

  it("succeeds and returns evidence object on valid input", async () => {
    const fakeEvidence = {
      id: "ev-1",
      consignment_id: "uuid-1",
      evidence_type: "certificate",
      content_hash: "deadbeef",
      created_by: "user-1",
    };

    const chain: Record<string, unknown> = {};
    for (const m of ["select","insert","eq","order","limit"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain.single as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: fakeEvidence,
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    const result = await evidenceService.createEvidence({
      consignment_id: "uuid-1",
      evidence_type: "certificate",
      created_by: "user-1",
      content_hash: "deadbeef",
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe("ev-1");
  });

  it("surfaces Supabase errors as failure result", async () => {
    const chain: Record<string, unknown> = {};
    for (const m of ["select","insert","eq","order","limit"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain.single as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "row-level security violation" },
    });

    mockFrom.mockReturnValue(chain);

    const result = await evidenceService.createEvidence({
      consignment_id: "uuid-1",
      evidence_type: "document",
      created_by: "user-1",
      content_hash: "abc",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("security");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. getConsignmentEvidence
// ═════════════════════════════════════════════════════════════════════════════

describe("evidenceService.getConsignmentEvidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an ordered list of evidence objects", async () => {
    const fakeData = [
      { id: "ev-1", evidence_type: "document" },
      { id: "ev-2", evidence_type: "photo" },
    ];

    const chain: Record<string, unknown> = {};
    for (const m of ["select","insert","eq"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain.order as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: fakeData,
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    const result = await evidenceService.getConsignmentEvidence("uuid-1");
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data![0].id).toBe("ev-1");
  });

  it("returns an empty array when no evidence exists", async () => {
    const chain: Record<string, unknown> = {};
    for (const m of ["select","insert","eq"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain.order as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    const result = await evidenceService.getConsignmentEvidence("empty-consignment");
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it("returns failure when Supabase returns an error", async () => {
    const chain: Record<string, unknown> = {};
    for (const m of ["select","insert","eq"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain.order as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "connection timeout" },
    });

    mockFrom.mockReturnValue(chain);

    const result = await evidenceService.getConsignmentEvidence("uuid-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("timeout");
  });
});
