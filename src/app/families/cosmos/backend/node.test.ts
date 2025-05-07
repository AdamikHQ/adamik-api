import { ChainId, ProviderType } from "../../../../model/types_WIP";
import { ThirdPartyProviderError } from "../../../../tools/handlers/errors";
import { fetchBalances } from "../node";

// Mock the fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the CHAINS constant
jest.mock("../../../../config/chains", () => ({
  CHAINS: {
    [ChainId.COSMOSHUB]: {
      providers: [
        {
          type: ProviderType.node,
          url: [
            "https://node1.cosmos.network",
            "https://node2.cosmos.network",
            "https://node3.cosmos.network",
          ],
        },
      ],
    },
  },
}));

describe("Node URL Failover Mechanism", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should try next URL when first one fails", async () => {
    // Mock first URL failing
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    // Mock second URL succeeding
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        balances: [
          {
            denom: "uatom",
            amount: "1000000",
          },
        ],
      }),
    });

    const result = await fetchBalances(ChainId.COSMOSHUB, "cosmos1...");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://node1.cosmos.network/cosmos/bank/v1beta1/balances/cosmos1...",
      { headers: {} }
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://node2.cosmos.network/cosmos/bank/v1beta1/balances/cosmos1...",
      { headers: {} }
    );
    expect(result).toHaveLength(1);
  });

  it("should throw error when all URLs fail", async () => {
    // Mock all URLs failing
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchBalances(ChainId.COSMOSHUB, "cosmos1...")).rejects.toThrow(ThirdPartyProviderError);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should succeed on first try when URL is working", async () => {
    // Mock first URL succeeding
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        balances: [
          {
            denom: "uatom",
            amount: "1000000",
          },
        ],
      }),
    });

    const result = await fetchBalances(ChainId.COSMOSHUB, "cosmos1...");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://node1.cosmos.network/cosmos/bank/v1beta1/balances/cosmos1...",
      { headers: {} }
    );
    expect(result).toHaveLength(1);
  });

  it("should handle non-200 responses as failures", async () => {
    // Mock first URL returning non-200
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    // Mock second URL succeeding
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        balances: [
          {
            denom: "uatom",
            amount: "1000000",
          },
        ],
      }),
    });

    const result = await fetchBalances(ChainId.COSMOSHUB, "cosmos1...");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
  });

  it("should handle invalid JSON responses as failures", async () => {
    // Mock first URL returning invalid JSON
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    // Mock second URL succeeding
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        balances: [
          {
            denom: "uatom",
            amount: "1000000",
          },
        ],
      }),
    });

    const result = await fetchBalances(ChainId.COSMOSHUB, "cosmos1...");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
  });
});
