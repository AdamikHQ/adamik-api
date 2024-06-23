import { z } from "zod";
import { addressBalancesDataSchema } from "./types";

describe("serialization", () => {
    describe("addressBalancesDataSchema", () => {
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
        const addressBalancesSchema = addressBalancesDataSchema(["a", "b", "c"]);
        test("addresses balances are correctly parsed as bigints", () => {
            expect(
                addressBalancesSchema.safeParse(input)
            ).toStrictEqual(output);
        });
    });

})