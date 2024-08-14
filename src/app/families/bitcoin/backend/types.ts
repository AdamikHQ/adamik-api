import z from "zod";

// Blockchair responses SUB-MODELS
const UtxosSchema = z.object({
  block_id: z.number(),
  transaction_hash: z.string(),
  index: z.number(),
  value: z.number(),
  address: z.string(),
});

const AddressSchema = z.object({
  type: z.string(),
  script_hex: z.string(),
  balance: z.number(),
  balance_usd: z.number(),
  received: z.number(),
  received_usd: z.number(),
  spent: z.number(),
  spent_usd: z.number(),
  output_count: z.number(),
  unspent_output_count: z.number(),
  first_seen_receiving: z.string(),
  last_seen_receiving: z.string(),
  first_seen_spending: z.string().nullable(),
  last_seen_spending: z.string().nullable(),
});

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
  state: z.number(),
  state_layer_2: z.number().optional(),
  results: z.number().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  rows: z.number().optional(),
  market_price_usd: z.number().optional(),
  total_rows: z.number().optional(),
  api: z.object({
    version: z.string(),
    last_major_update: z.string().optional(),
    next_major_update: z.string().optional(),
    documentation: z.string().optional(),
    notice: z.string().optional(),
  }).optional(),
  cache: z.object({
    live: z.boolean(),
    until: z.string().optional(),
  }).optional(),
  request_cost: z.number(),
});

/**
 *  Dynamic body of the blockchair response for the call
 *  https://api.blockchair.com/{:btc_chain}/dashboards/xpub/{:xpub}
 *
 *  @param xpub xpub to check the balance of
 *
 *  @link https://blockchair.com/api/docs#link_300
 *
 *  @example
 *  ```json
{
  "data": {
    "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz": {
      "xpub": {
        "address_count": 11,
        "balance": 491868,
        "balance_usd": 36.744556258799996,
        "received": 711868,
        "spent": 220000,
        "output_count": 11,
        "unspent_output_count": 9,
        "first_seen_receiving": "2014-12-22 17:42:10",
        "last_seen_receiving": "2019-09-25 16:12:10",
        "first_seen_spending": "2014-12-22 21:32:22",
        "last_seen_spending": "2014-12-23 17:26:21",
        "transaction_count": 13
      },
      "addresses": {
        "1EfgV2Hr5CDjXPavHDpDMjmU33BA2veHy6": {
          "path": "0/0",
          "type": "pubkeyhash",
          "script_hex": "76a91495ea668e0322bd99dac54ffdc9089d68e56c3aa188ac",
          "balance": 0,
          "balance_usd": 0,
          "received": 100000,
          "received_usd": 0.3255,
          "spent": 100000,
          "spent_usd": 0.3292,
          "output_count": 1,
          "unspent_output_count": 0,
          "first_seen_receiving": "2014-12-22 17:42:10",
          "last_seen_receiving": "2014-12-22 17:42:10",
          "first_seen_spending": "2014-12-23 17:26:21",
          "last_seen_spending": "2014-12-23 17:26:21"
        },
        "1LDPJCMZhYZjTvTGYahdhMXLuMfjfi6Kua": {
          "path": "0/29",
          "type": "pubkeyhash",
          "script_hex": "76a914d2c1fe5c55a1e9d818149750f2662ba57748247088ac",
          "balance": 1000,
          "balance_usd": 0.07470410000000001,
          "received": 1000,
          "received_usd": 0.0868,
          "spent": 0,
          "spent_usd": 0,
          "output_count": 1,
          "unspent_output_count": 1,
          "first_seen_receiving": "2019-09-25 16:12:10",
          "last_seen_receiving": "2019-09-25 16:12:10",
          "first_seen_spending": null,
          "last_seen_spending": null
        }
      },
      "transactions": [
        "a24445474a9a7c0698e8db221ad2cae06792a899e9bc7f5a590687c3c810c480"
      ],
      "utxo": [
        {
          "block_id": 596536,
          "transaction_hash": "a24445474a9a7c0698e8db221ad2cae06792a899e9bc7f5a590687c3c810c480",
          "index": 0,
          "value": 1000,
          "address": "1LDPJCMZhYZjTvTGYahdhMXLuMfjfi6Kua"
        },
        {
          "block_id": 549163,
          "transaction_hash": "0c9a0219a8f3ef4a7d00483a755a9a18a674340c547bdf573481c1c613898746",
          "index": 0,
          "value": 1800,
          "address": "1MS6eGqD4iUGyJPbEsjqmoNaRhApgtmF8J"
        }
      ]
    }
  },
  "context": {
    "code": 200,
    "limit": "1,2",
    "offset": "0,0",
    "results": 1,
    "checked": [
      "0/0: 1EfgV2Hr5CDjXPavHDpDMjmU33BA2veHy6",
      "0/1: 12iNxzdF6KFZ14UyRTYCRuptxkKSSVHzqF",
      "1/0: 1muF2Eq9iR4ttJKpc4zZkoTmu3E41Ab9v",
      "1/1: 18RtYUqcNDRjvbB8gg2hwxCYkWwuFcURJp",

    ],
    "state": 600898,
    ...
  }
}
 */
export const BlockchairXpubData = z.record(
  z.string(),
  z.object({
    xpub: z.object({
      address_count: z.number(),
      balance: z.number().pipe(z.coerce.bigint()),
      balance_usd: z.number(),
      received: z.number().pipe(z.coerce.bigint()),
      received_usd: z.number().optional(),
      spent: z.number(),
      spent_usd: z.number().optional(),
      output_count: z.number(),
      unspent_output_count: z.number(),
      first_seen_receiving: z.string(),
      last_seen_receiving: z.string(),
      first_seen_spending: z.string().nullable(),
      last_seen_spending: z.string().nullable(),
      transaction_count: z.number(),
    }),
    addresses: z.record(
      z.string(),
      AddressSchema.and(
        z.object({
          path: z.string(),
        })
      )
    ),
    transactions: z.array(z.string()),
    utxo: UtxosSchema.array(),
  })
);

export const BlockchairXpubResponse = z.object({
  data: BlockchairXpubData,
  context: requestContextSchema.and(
    // not part of the typical context answer, only happens in the xpub dashboard
    z.object({
      checked: z.array(z.string()),
    })
  ),
});

export const BlockchairAddressesResponse = z.object({
  data: z.object({
    set: AddressSchema.omit({
      type: true,
      script_hex: true,
      received_usd: true,
      spent_usd: true,
    }),
    addresses: z.record(z.string(), AddressSchema),
    transactions: z.array(z.string()),
    utxo: UtxosSchema.and(
      z.object({
        address: z.string(),
      })
    ).array(),
  }),
  context: requestContextSchema,
});

/**
 * Dynamic body schema for the POST /push/transaction endpoint
 * https://api.blockchair.com/{:chain}/push/transaction
 *  *
 *  @param chain chain on which the transaction should be broadcasted
 *
 *  @link https://blockchair.com/api/docs#link_202
 *
 *  @example
    ```json
    {
      "data": {
        "transaction_hash": "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098"
      },
      "context": {
        "code": 200,
        ...
      }
    }
    ```
 * 
 */
export const TransactionBroadcastStatusSchema = z.object({
  data: z.object({
    transaction_hash: z.string(),
  }).optional(),
  context: requestContextSchema,
})