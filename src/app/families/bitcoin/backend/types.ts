import z from "zod";

/**
 * Metadata that's part of all blockchair responses
 * 
 * @example
 * ```json
    {
        "code":200,
        "source":"A",
        "time":0.007825851440429688,
        "limit":10000,
        "offset":null,
        "rows":1,
        "pre_rows":1,
        "total_rows":1,
        "state":600767,
        "market_price_usd": 63691,
        "cache": {
            "live": true,
            "duration": 60,
            "since": "2019-10-23 21:33:00",
            "until": "2019-10-23 21:34:00",
            "time": null
        },
        "api": {
            "version": "2.0.38",
            "last_major_update": "2019-07-19 18:07:19",
            "next_major_update": null,
            "documentation": "https:\/\/github.com\/Blockchair\/Blockchair.Support\/blob\/master\/API.md",
            "notice": "Beginning July 19th, 2019 all applications using Blockchair API on a constant basis should apply for an API key (mailto:info@blockchair.com)"
        }
 }
 */
export const requestContextSchema = z.object({
    code: z.number(),
    error: z.string().optional(),
    state: z.number().optional(),
    state_layer_2: z.number().optional(),
    results: z.number().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    rows: z.number().optional(),
    market_price_usd: z.number().optional(),
    total_rows: z.number().optional(),
    api: z.array(
        z.object({
            version: z.string(),
            last_major_update: z.string().optional(),
            next_major_update: z.string().optional(),
            documentation: z.string().optional(),
            notice: z.string().optional(),
        })
    ).optional(),
    cache: z.array(
        z.object({
            live: z.boolean(),
            until: z.string().optional(),
        }),
    ).optional(),
    request_cost: z.number(),
});

/**
 * Dynamic body of the blockchair response for the call
 * https://api.blockchair.com/{:btc_chain}/addresses/balances (POST)
 * 
 * @param addresses list of addresses to check the balance of
 * 
 * @link https://blockchair.com/api/docs#link_390
 * 
 * @example 
 * ```json
    {
        "data": {
            "35hK24tcLEWcgNA4JxpvbkNkoAcDGqQPsP": 25550215769897,
            "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo": 4053399981517
        },
        "context": {
            "code": 200,
            "results": 2,
            "state": 635329,
            "request_cost": 1.003,
            ...
        }
    }
 * ```
 */
export const addressBalancesDataSchema = (addresses: string[]): z.ZodSchema<{
    data: Record<string, bigint>;
    context: z.infer<typeof requestContextSchema>;
}> => {
    const toNumber = z.number().or(z.string()).pipe(z.coerce.number());
    const toBigInt = z.bigint().or(toNumber).pipe(z.coerce.bigint());
    return z.object({
        data: addresses.reduce((object, address) => {
            return object.setKey(address, toBigInt);
        }, z.object({})),
        context: requestContextSchema,
    })
};
