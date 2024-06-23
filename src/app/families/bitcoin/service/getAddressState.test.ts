import { getAddressState } from "./getAddressState";
import { BtcService } from ".";
import { AddressState, ChainId } from "~/app/model/types_WIP";

const CHAIN_ID = ChainId.BITCOIN;

describe("getAddressState", () => {
    it("should fetch address state successfully", async () => {
        const btcService = new BtcService(CHAIN_ID);
        const address = "sample_address";
        const expectedAddressState: AddressState = {
            chainId: btcService.chainId,
            address,
            balances: {
                native: {
                    available: 25550215769897n,
                },
            },
        };

        // Mocking fetch to return successful response with the example from getAddressState
        jest.spyOn(global, "fetch").mockResolvedValueOnce(Promise.resolve(new Response(
            JSON.stringify({
                data: {
                    sample_address: 25550215769897,
                },
                context: {
                    code: 200,
                    results: 1,
                    state: 635329,
                    request_cost: 1.003,
                }
            }),
        )));

        const result = await getAddressState.call(btcService, address);
        expect(result).toEqual(expectedAddressState);
    });

    it("should have balance at 0n if blockchair returns invalid response", async () => {
        const btcService = new BtcService(CHAIN_ID);
        const address = "sample_address";
        const expectedAddressState = {
            chainId: btcService.chainId,
            address,
            balances: {
                native: {
                    available: 0n,
                },
            },
        };
        
        jest.spyOn(global, "fetch").mockResolvedValueOnce(Promise.resolve(new Response(
            JSON.stringify({}),
        )));

        const result = await getAddressState.call(btcService, address);

        expect(result).toEqual(expectedAddressState)
    });

    it("should have balance at 0n if blockchair returns response with error code 400", async () => {
        const btcService = new BtcService(CHAIN_ID);
        const address = "sample_address";
        const expectedAddressState = {
            chainId: btcService.chainId,
            address,
            balances: {
                native: {
                    available: 0n,
                },
            },
        };

        jest.spyOn(global, "fetch").mockResolvedValueOnce(Promise.resolve(new Response(
            JSON.stringify({
                data: null,
                context: {
                    code: 400,
                    error: "Addresses are not set",
                    request_cost: 1,
                },
            }),
        )));

        const result = await getAddressState.call(btcService, address);
        expect(result).toEqual(expectedAddressState)
    });
});