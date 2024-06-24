import { z } from "zod";
import { addressBalancesDataSchema } from "./types";

describe("serialization", () => {
    describe("addressBalancesDataSchema", () => {

        const addressBalancesSchema = addressBalancesDataSchema(["a", "b", "c"]);
        it("should make sure addresses balances are correctly parsed as bigints", () => {
            const input = {
                data: {
                    a: 25550215769897,
                    b: 45550215769897,
                    c: 65550215769897,
                }, context: {
                    code: 200,
                    results: 3,
                    state: 635329,
                    request_cost: 1.003,
                },
            };
            const output = {
                success: true,
                data: {
                    data: {
                        a: 25550215769897n,
                        b: 45550215769897n,
                        c: 65550215769897n,
                    },
                    context: {
                        code: 200,
                        results: 3,
                        state: 635329,
                        request_cost: 1.003,
                    },
                },
            };
            expect(
                addressBalancesSchema.safeParse(input)
            ).toStrictEqual(output);
        });
        it("should correctly parse empty data sent as an array", () => {
            const input = {
                data: [],
                context: {
                    code: 200,
                    results: 0,
                    state: 635329,
                    request_cost: 1.003,
                },
            };
            const output = {
                success: true,
                data: {
                    data: {},
                    context: {
                        code: 200,
                        results: 0,
                        state: 635329,
                        request_cost: 1.003,
                    },
                },
            };
            expect(
                addressBalancesSchema.safeParse(input)
            ).toStrictEqual(output);
        });
        it("should correctly parse empty data field is null", () => {
            const input = {
                data: null,
                context: {
                    code: 400,
                    error: "Addresses are not set",
                    request_cost: 1,
                },
            };
            const output = {
                success: true,
                data: {
                    data: {},
                    context: {
                        code: 400,
                        request_cost: 1,
                        error: "Addresses are not set",
                    },
                },
            };
            expect(
                addressBalancesSchema.safeParse(input)
            ).toStrictEqual(output);
        });
    });

})