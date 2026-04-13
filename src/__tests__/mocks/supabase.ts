import { vi } from "vitest";

const chainMethods = () => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    then: vi.fn(),
    _resolveWith: (data: any, error: any = null) => {
      chain.then.mockImplementation((resolve: any) => {
        resolve({ data, error });
        return { catch: vi.fn() };
      });
      // Also make the chain itself resolve
      Object.assign(chain, { data, error });
      return chain;
    },
  };
  return chain;
};

export const mockSupabaseClient = {
  from: vi.fn(() => chainMethods()),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "test-token" } }, error: null }),
  },
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabaseClient,
}));
