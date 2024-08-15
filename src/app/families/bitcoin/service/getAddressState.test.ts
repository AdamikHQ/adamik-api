import { getAddressesState } from "./getAddressesState";
import { BtcService } from ".";
import { AddressState, AddressesState, ChainId } from "~/app/model/types_WIP";

const CHAIN_ID = ChainId.BITCOIN;

describe("getAddressState", () => {
    it("should fetch address state successfully", async () => {
        const btcService = new BtcService(CHAIN_ID);
        const expectedAddressState: AddressesState = {
            chainId: btcService.chainId,
            addresses: {
                '1D5Ubr99suo6ZUTWzsVBfURx9E5iVTyzGj': {
                    balances: {
                        native: {
                            available: 100000000n,
                            total: 100000000n,
                            unconfirmed: 0n
                        }
                    },
                },
            },
        };

        // Mocking fetch to return successful response with the example from getAddressState
        jest.spyOn(global, "fetch").mockResolvedValueOnce(Promise.resolve(new Response(
            JSON.stringify({
                "data": {
                    "set": {
                        "address_count": 1,
                        "balance": 100000000,
                        "balance_usd": 56946,
                        "received": 100000000,
                        "spent": 0,
                        "output_count": 1,
                        "unspent_output_count": 1,
                        "first_seen_receiving": "2011-11-22 20:02:44",
                        "last_seen_receiving": "2011-11-22 20:02:44",
                        "first_seen_spending": null,
                        "last_seen_spending": null,
                        "transaction_count": 1
                    },
                    "addresses": {
                        "1D5Ubr99suo6ZUTWzsVBfURx9E5iVTyzGj": {
                            "type": "pubkeyhash",
                            "script_hex": "76a914847a3697b3cb9949e8f9ab41a4c8bc8b9387c59f88ac",
                            "balance": 100000000,
                            "balance_usd": 56946,
                            "received": 100000000,
                            "received_usd": 2.23,
                            "spent": 0,
                            "spent_usd": 0,
                            "output_count": 1,
                            "unspent_output_count": 1,
                            "first_seen_receiving": "2011-11-22 20:02:44",
                            "last_seen_receiving": "2011-11-22 20:02:44",
                            "first_seen_spending": null,
                            "last_seen_spending": null
                        }
                    },
                    "transactions": [
                        "922ef1f3ded2ce18f7ef0870270621ec73f69b90efe32eef19d5565a41c29aea"
                    ],
                    "utxo": [
                        {
                            "block_id": 154385,
                            "transaction_hash": "922ef1f3ded2ce18f7ef0870270621ec73f69b90efe32eef19d5565a41c29aea",
                            "index": 59,
                            "value": 100000000,
                            "address": "1D5Ubr99suo6ZUTWzsVBfURx9E5iVTyzGj"
                        }
                    ]
                },
                "context": {
                    "code": 200,
                    "source": "D",
                    "limit": "100,100",
                    "offset": "0,0",
                    "results": 1,
                    "optimized": false,
                    "state": 851263,
                    "market_price_usd": 56946,
                    "cache": {
                        "live": true,
                        "duration": 120,
                        "since": "2024-07-08 14:03:15",
                        "until": "2024-07-08 14:05:15",
                        "time": null
                    },
                    "api": {
                        "version": "2.0.95-ie",
                        "last_major_update": "2022-11-07 02:00:00",
                        "next_major_update": "2023-11-12 02:00:00",
                        "documentation": "https:\/\/blockchair.com\/api\/docs",
                        "notice": "Try out our new API v.3: https:\/\/3xpl.com\/data"
                    },
                    "servers": "API4,BTC4",
                    "time": 0.45909905433654785,
                    "render_time": 0.007881879806518555,
                    "full_time": 0.4669809341430664,
                    "request_cost": 1
                }
            }),
        )));

        const result = await getAddressesState.call(btcService, ["1D5Ubr99suo6ZUTWzsVBfURx9E5iVTyzGj"]);
        expect(result).toEqual(expectedAddressState);
    });

    it("should have balance at 0n if blockchair returns invalid response", async () => {
        const btcService = new BtcService(CHAIN_ID);
        const expectedAddressState: AddressesState = {
            chainId: btcService.chainId,
            addresses: {
                sample_address: {
                    balances: {
                        native: {
                            available: 0n,
                            total: 0n,
                        },
                    },
                },
            },
        };

        jest.spyOn(global, "fetch").mockResolvedValueOnce(Promise.resolve(new Response(
            JSON.stringify({}),
        )));

        // TODO: make this test more robust and test for specific error instead of generic Error
        await expect(btcService.getAddressesState(['sample_address'])).rejects.toThrow();
    });

    it("should have balance at 0n if blockchair returns response with error code 400", async () => {
        const btcService = new BtcService(CHAIN_ID);
        const expectedAddressState: AddressesState = {
            chainId: btcService.chainId,
            addresses: {
                sample_address: {
                    balances: {
                        native: {
                            available: 0n,
                            total: 0n,
                        },
                    },
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
        jest.spyOn(global, "fetch").mockResolvedValueOnce(Promise.resolve(new Response(
            nullDataResponse,
        )));

        const result = await getAddressesState.call(btcService, ['sample_address']);
        expect(result).toEqual(expectedAddressState)
    });
});
