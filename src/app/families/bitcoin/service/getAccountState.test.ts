import { BtcService } from ".";
import { AccountState, ChainId } from "~/app/model/types_WIP";

const CHAIN_ID = ChainId.BITCOIN;

describe("getAccountState", () => {
  it("should fetch address state successfully", async () => {
    const btcService = new BtcService(CHAIN_ID);
    const expectedAddressState: AccountState = {
      chainId: btcService.chainId,
      accountId: "sample_address",
      balances: {
        native: {
          available: 25550215769897n,
          total: 25550215769897n,
        },
      },
    };

    // Mocking fetch to return successful response with the example from getAddressState
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              sample_address: 25550215769897,
            },
            context: {
              code: 200,
              results: 1,
              state: 635329,
              request_cost: 1.003,
            },
          })
        )
      )
    );

    const result = await btcService.getAccountState({ addresses: ["sample_address"] });
    expect(result).toEqual(expectedAddressState);
  });

  it("should have balance at 0n if blockchair returns invalid response", async () => {
    const btcService = new BtcService(CHAIN_ID);
    const expectedAddressState: AccountState = {
      chainId: btcService.chainId,
      accountId: "sample_address",
      balances: {
        native: {
          available: 0n,
          total: 0n,
        },
      },
    };

    jest.spyOn(global, "fetch").mockResolvedValueOnce(Promise.resolve(new Response(JSON.stringify({}))));

    // TODO: make this test more robust and test for specific error instead of generic Error
    await expect(btcService.getAccountState({ accountId: "sample_address" })).rejects.toThrow();
  });

  it("should have balance at 0n if blockchair returns response with error code 400", async () => {
    const btcService = new BtcService(CHAIN_ID);
    const expectedAddressState: AccountState = {
      chainId: btcService.chainId,
      accountId: "sample_address",
      balances: {
        native: {
          available: 0n,
          total: 0n,
        },
      },
    };

    const nullDataResponse = JSON.stringify({
      data: null,
      context: {
        code: 400,
        error: "Addresses are not set",
        request_cost: 1,
      },
    });
    jest.spyOn(global, "fetch").mockResolvedValueOnce(Promise.resolve(new Response(nullDataResponse)));

    const result = await btcService.getAccountState({ addresses: ["sample_address"] });
    expect(result).toEqual(expectedAddressState);
  });
});
