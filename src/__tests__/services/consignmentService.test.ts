/**
 * consignmentService.test.ts
 * Tests for the core consignment case service.
 *
 * Coverage:
 *   ✅  validateCaseNumberFormat() — regex validation (pure, no mocks needed)
 *   ✅  generateNextCaseNumber()   — format check (pure)
 *   ✅  createCase()               — validation guards (format, exporter_id, destination)
 *   ✅  getCaseByNumber()          — happy path + not-found
 *   ✅  listCases()                — returns array on success
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── MOCKS ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { consignmentService } from "@/services/consignmentService";

// ═════════════════════════════════════════════════════════════════════════════
// 1. validateCaseNumberFormat — PURE FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

describe("consignmentService.validateCaseNumberFormat", () => {
  // ── Valid formats ──────────────────────────────────────────────────────────
  it("accepts CS-YYYY-NNN (3-digit sequence)", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-2026-001")).toBe(true);
  });

  it("accepts CS-YYYY-NNN with different year", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-2025-999")).toBe(true);
  });

  it("accepts CS-YYYY-NNNNNN (6-digit sequence, max allowed)", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-2026-123456")).toBe(true);
  });

  it("accepts CS-YYYY-NNNN (4-digit sequence)", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-2026-0042")).toBe(true);
  });

  // ── Invalid formats ────────────────────────────────────────────────────────
  it("rejects lowercase prefix", () => {
    expect(consignmentService.validateCaseNumberFormat("cs-2026-001")).toBe(false);
  });

  it("rejects missing year section", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-001")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(consignmentService.validateCaseNumberFormat("")).toBe(false);
  });

  it("rejects format without dashes", () => {
    expect(consignmentService.validateCaseNumberFormat("CS2026001")).toBe(false);
  });

  it("rejects 2-digit sequence number (min is 3)", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-2026-01")).toBe(false);
  });

  it("rejects 7-digit sequence number (max is 6)", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-2026-1234567")).toBe(false);
  });

  it("rejects non-numeric sequence", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-2026-ABC")).toBe(false);
  });

  it("rejects 3-digit year", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-202-001")).toBe(false);
  });

  it("rejects extra prefix characters", () => {
    expect(consignmentService.validateCaseNumberFormat("XCS-2026-001")).toBe(false);
  });

  it("rejects trailing characters", () => {
    expect(consignmentService.validateCaseNumberFormat("CS-2026-001-X")).toBe(false);
  });

  it("rejects MG- lot format (different schema)", () => {
    expect(consignmentService.validateCaseNumberFormat("MG-2026-001")).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. generateNextCaseNumber — PURE FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

describe("consignmentService.generateNextCaseNumber", () => {
  it("returns a string matching CS-YYYY-NNN format", () => {
    const cn = consignmentService.generateNextCaseNumber(2026);
    expect(cn).toMatch(/^CS-2026-\d{3}$/);
  });

  it("uses the provided year", () => {
    const cn = consignmentService.generateNextCaseNumber(2030);
    expect(cn.startsWith("CS-2030-")).toBe(true);
  });

  it("defaults to current year when no year is provided", () => {
    const year = new Date().getFullYear();
    const cn = consignmentService.generateNextCaseNumber();
    expect(cn.startsWith(`CS-${year}-`)).toBe(true);
  });

  it("sequence number is between 100 and 999", () => {
    for (let i = 0; i < 20; i++) {
      const cn = consignmentService.generateNextCaseNumber(2026);
      const seq = parseInt(cn.split("-")[2], 10);
      expect(seq).toBeGreaterThanOrEqual(100);
      expect(seq).toBeLessThanOrEqual(999);
    }
  });

  it("generated number always passes validateCaseNumberFormat", () => {
    for (let i = 0; i < 20; i++) {
      const cn = consignmentService.generateNextCaseNumber(2026);
      expect(consignmentService.validateCaseNumberFormat(cn)).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. createCase — VALIDATION GUARDS
// ═════════════════════════════════════════════════════════════════════════════

describe("consignmentService.createCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed case_number without touching Supabase", async () => {
    const result = await consignmentService.createCase({
      case_number: "BAD-FORMAT",
      exporter_id: "user-1",
      destination_country: "US",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("CS-YYYY-NNN");
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects missing exporter_id", async () => {
    // caseNumberExists check — mock the from() used for uniqueness check
    const chain: Record<string, unknown> = {};
    for (const m of ["select","eq"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain as Record<string, unknown>).count = 0;
    (chain as Record<string, unknown>).error = null;
    // mockFrom doesn't get called until after exporter_id check
    // The guard runs before DB query, so mockFrom should NOT be called
    const result = await consignmentService.createCase({
      case_number: "CS-2026-001",
      exporter_id: "",
      destination_country: "US",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("exporter_id");
  });

  it("rejects missing destination_country", async () => {
    const result = await consignmentService.createCase({
      case_number: "CS-2026-001",
      exporter_id: "user-1",
      destination_country: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("destination_country");
  });

  it("rejects duplicate case_number", async () => {
    // Mock caseNumberExists → count = 1
    const chain: Record<string, unknown> = {};
    for (const m of ["insert","order","limit"]) {
      chain[m] = vi.fn(() => chain);
    }
    // select returns a chain where the terminal resolves with count=1
    (chain.select as ReturnType<typeof vi.fn>) = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
    }));

    mockFrom.mockReturnValue(chain);

    const result = await consignmentService.createCase({
      case_number: "CS-2026-001",
      exporter_id: "user-1",
      destination_country: "US",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("ya existe");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. getCaseByNumber — QUERY
// ═════════════════════════════════════════════════════════════════════════════

describe("consignmentService.getCaseByNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the consignment case when found", async () => {
    const fakeCase = {
      id: "uuid-1",
      case_number: "CS-2026-001",
      current_state: "import_ready",
      evidence_completeness_pct: 96,
    };

    const chain: Record<string, unknown> = {};
    for (const m of ["eq","order","limit"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain.select as ReturnType<typeof vi.fn>) = vi.fn(() => chain);
    (chain.single as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: fakeCase,
      error: null,
    });
    (chain.maybeSingle as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: fakeCase,
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    const result = await consignmentService.getCaseByNumber("CS-2026-001");
    expect(result.success).toBe(true);
    expect(result.data?.case_number).toBe("CS-2026-001");
    expect(result.data?.current_state).toBe("import_ready");
  });

  it("returns failure when case is not found", async () => {
    const chain: Record<string, unknown> = {};
    for (const m of ["eq","order","limit"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain.select as ReturnType<typeof vi.fn>) = vi.fn(() => chain);
    (chain.single as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    });
    (chain.maybeSingle as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    const result = await consignmentService.getCaseByNumber("CS-2099-999");
    // Either null data or failure — both are acceptable "not found" responses
    if (result.success) {
      expect(result.data).toBeNull();
    } else {
      expect(result.success).toBe(false);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. listCases — BASIC QUERY
// ═════════════════════════════════════════════════════════════════════════════

describe("consignmentService.listCases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of consignment cases", async () => {
    const fakeCases = [
      { id: "uuid-1", case_number: "CS-2026-001", current_state: "import_ready" },
      { id: "uuid-2", case_number: "CS-2026-002", current_state: "custody_continuous" },
    ];

    const chain: Record<string, unknown> = {};
    for (const m of ["eq","limit","select"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain.order as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: fakeCases,
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    const result = await consignmentService.listCases();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data![0].case_number).toBe("CS-2026-001");
  });

  it("returns empty array when no cases exist", async () => {
    const chain: Record<string, unknown> = {};
    for (const m of ["eq","limit","select"]) {
      chain[m] = vi.fn(() => chain);
    }
    (chain.order as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    const result = await consignmentService.listCases();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });
});
