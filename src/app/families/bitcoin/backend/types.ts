import { UTXO } from "coinselect";
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
const requestContextSchema = z.object({
  code: z.number(),
  error: z.string().optional(),
  state: z.number().optional(),
  state_layer_2: z.number().optional(),
  results: z.number().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  rows: z.number().optional(),
  market_price_usd: z.number().optional(),
  total_rows: z.number().optional(),
  api: z
    .object({
      version: z.string(),
      last_major_update: z.string().optional(),
      next_major_update: z.string().optional(),
      documentation: z.string().optional(),
      notice: z.string().optional(),
    })
    .optional(),
  cache: z
    .object({
      live: z.boolean(),
      until: z.string().optional(),
    })
    .optional(),
  request_cost: z.number(),
});

const BlockchairUtxoData = z
  .object({
    block_id: z.number(),
    transaction_hash: z.string(),
    index: z.number(),
    value: z.number(),
    address: z.string(),
  })
  .transform((data) => {
    return {
      /** add fields for compatibility with coinselect @see {@link UTXO} */
      txid: data.transaction_hash,
      vout: data.index,
      ...data,
    };
  });

type BlockchairUtxoData = z.infer<typeof BlockchairUtxoData>;

const BlockchairAddressData = z.object({
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

const BlockchairAddressesResponse = z.object({
  data: z
    .object({
      set: BlockchairAddressData.omit({
        type: true,
        script_hex: true,
        received_usd: true,
        spent_usd: true,
      }),
      addresses: z.record(z.string(), BlockchairAddressData),
      transactions: z.array(z.string()),
      utxo: BlockchairUtxoData.and(
        z.object({
          address: z.string(),
        })
      ).array(),
    })
    .nullable(),
  context: requestContextSchema,
});

type BlockchairAddressesResponse = z.infer<typeof BlockchairAddressesResponse>;

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
const BlockchairXpubData = z.record(
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
      BlockchairAddressData.and(
        z.object({
          path: z.string(),
        })
      )
    ),
    transactions: z.array(z.string()),
    utxo: BlockchairUtxoData.array(),
  })
);

const BlockchairXpubResponse = z.object({
  data: BlockchairXpubData.or(z.tuple([]))
    .nullable()
    .transform((data) => (!data || Array.isArray(data) ? {} : data))
    .pipe(BlockchairXpubData),
  context: requestContextSchema.and(
    // not part of the typical context answer, only happens in the xpub dashboard
    z.object({
      checked: z.array(z.string()),
    })
  ),
});

type BlockchairXpubResponse = z.infer<typeof BlockchairXpubResponse>;

/**
 *  Dynamic body of the blockchair response for the call
 *  https://api.blockchair.com/{:btc_chain}/dashboards/transaction/{:txhash}
 *
 *  @param txhash hash of the transaction to get
 *
 *  @link https://blockchair.com/api/docs#link_200
 *
 *  @example
 *  ```json
{
  "data": {
    "559c1be45865069c6070529e43c69752d73438cbb1d04e4f301e94cd68bf7422": {
      "transaction": {
        "block_id": 833245,
        "id": 972897107,
        "hash": "559c1be45865069c6070529e43c69752d73438cbb1d04e4f301e94cd68bf7422",
        "date": "2024-03-05",
        "time": "2024-03-05 10:54:05",
        "size": 194,
        "weight": 569,
        "version": 2,
        "lock_time": 0,
        "is_coinbase": false,
        "has_witness": true,
        "input_count": 1,
        "output_count": 2,
        "input_total": 30040,
        "input_total_usd": 20.520325,
        "output_total": 22026,
        "output_total_usd": 15.045959999999999,
        "fee": 8014,
        "fee_usd": 5.4743633,
        "fee_per_kb": 41309.277,
        "fee_per_kb_usd": 28.218367,
        "fee_per_kwu": 14084.358,
        "fee_per_kwu_usd": 9.621025,
        "cdd_total": 0.0016629469490741,
        "is_rbf": true
      },
      "inputs": [
        {
          "block_id": 832455,
          "transaction_id": 970761996,
          "index": 1,
          "transaction_hash": "fb4ee6c44f7b7c738e6d6d65a2042b0b4b96d5e169e309df9daec3bdc5a8806c",
          "date": "2024-02-28",
          "time": "2024-02-28 22:02:34",
          "value": 30040,
          "value_usd": 17.144428,
          "recipient": "bc1plwvvqkh4nu49xn79me5uagwlxuzytdrdw7jlxkj2ue88xg5c3t7qte60uy",
          "type": "witness_v1_taproot",
          "script_hex": "5120fb98c05af59f2a534fc5de69cea1df370445b46d77a5f35a4ae64e7322988afc",
          "is_from_coinbase": false,
          "is_spendable": null,
          "is_spent": true,
          "spending_block_id": 833245,
          "spending_transaction_id": 972897107,
          "spending_index": 0,
          "spending_transaction_hash": "559c1be45865069c6070529e43c69752d73438cbb1d04e4f301e94cd68bf7422",
          "spending_date": "2024-03-05",
          "spending_time": "2024-03-05 10:54:05",
          "spending_value_usd": 20.520325,
          "spending_sequence": 0,
          "spending_signature_hex": "",
          "spending_witness": "303d662b70f0732829074efa140c0cdf617ad397fdbe49e5150e933208756baac7b8503e5bfa5b671a89c7fcb4bb9b3da6be68df6b1c4ebabd368a635881d10b01",
          "lifespan": 478291,
          "cdd": 0
        }
      ],
      "outputs": [
        {
          "block_id": 833245,
          "transaction_id": 972897107,
          "index": 0,
          "transaction_hash": "559c1be45865069c6070529e43c69752d73438cbb1d04e4f301e94cd68bf7422",
          "date": "2024-03-05",
          "time": "2024-03-05 10:54:05",
          "value": 10000,
          "value_usd": 6.831,
          "recipient": "bc1qmzpxvus57cy6rs4rytgwqqu264n2l8g5qnk8gt",
          "type": "witness_v0_keyhash",
          "script_hex": "0014d882667214f609a1c2a322d0e0038ad566af9d14",
          "is_from_coinbase": false,
          "is_spendable": null,
          "is_spent": false,
          "spending_block_id": null,
          "spending_transaction_id": null,
          "spending_index": null,
          "spending_transaction_hash": null,
          "spending_date": null,
          "spending_time": null,
          "spending_value_usd": null,
          "spending_sequence": null,
          "spending_signature_hex": null,
          "spending_witness": null,
          "lifespan": null,
          "cdd": null
        },
        {
          "block_id": 833245,
          "transaction_id": 972897107,
          "index": 1,
          "transaction_hash": "559c1be45865069c6070529e43c69752d73438cbb1d04e4f301e94cd68bf7422",
          "date": "2024-03-05",
          "time": "2024-03-05 10:54:05",
          "value": 12026,
          "value_usd": 8.214961,
          "recipient": "bc1pemy74vryek43nn5kp70md9n9htychjsycetrqawspwn0a567s37snavuy0",
          "type": "witness_v1_taproot",
          "script_hex": "5120cec9eab064cdab19ce960f9fb69665bac98bca04c6563075d00ba6fed35e847d",
          "is_from_coinbase": false,
          "is_spendable": null,
          "is_spent": false,
          "spending_block_id": null,
          "spending_transaction_id": null,
          "spending_index": null,
          "spending_transaction_hash": null,
          "spending_date": null,
          "spending_time": null,
          "spending_value_usd": null,
          "spending_sequence": null,
          "spending_signature_hex": null,
          "spending_witness": null,
          "lifespan": null,
          "cdd": null
        }
      ]
    }
  },
  "context": {
    "code": 200,
    "source": "D",
    "results": 1,
    "state": 859056,
    "market_price_usd": 59386,
    "cache": {
      "live": true,
      "duration": 30,
      "since": "2024-08-30 07:47:20",
      "until": "2024-08-30 07:47:50",
      "time": null
    },
    "api": {
      "version": "2.0.95-ie",
      "last_major_update": "2022-11-07 02:00:00",
      "next_major_update": "2023-11-12 02:00:00",
      "documentation": "https://blockchair.com/api/docs",
      "notice": "Try out our new API v.3: https://3xpl.com/data"
    },
    "servers": "API4,BTC5",
    "time": 0.027289867401123048,
    "render_time": 0.05180215835571289,
    "full_time": 0.07909202575683594,
    "request_cost": 1
  }
}
*/
const BlockchairTransactionData = z.record(
  z.string(),
  z.object({
    transaction: z.object({
      block_id: z.number(),
      id: z.number().pipe(z.coerce.bigint()),
      hash: z.string(),
      date: z.string(),
      time: z.string(),
      size: z.number(),
      weight: z.number(),
      version: z.number(),
      lock_time: z.number(),
      is_coinbase: z.boolean(),
      has_witness: z.boolean(),
      input_count: z.number(),
      output_count: z.number(),
      input_total: z.number().pipe(z.coerce.bigint()),
      input_total_usd: z.number(),
      output_total: z.number().pipe(z.coerce.bigint()),
      output_total_usd: z.number(),
      fee: z.number().pipe(z.coerce.bigint()),
      fee_usd: z.number(),
      fee_per_kb: z.number(),
      fee_per_kb_usd: z.number(),
      fee_per_kwu: z.number(),
      fee_per_kwu_usd: z.number(),
      cdd_total: z.number(),
      is_rbf: z.boolean().optional(),
    }),
    inputs: z
      .object({
        block_id: z.number().pipe(z.coerce.bigint()),
        transaction_id: z.number().pipe(z.coerce.bigint()),
        index: z.number(),
        transaction_hash: z.string(),
        date: z.string(),
        time: z.string(),
        value: z.number().pipe(z.coerce.bigint()),
        value_usd: z.number(),
        recipient: z.string(),
        type: z.string(),
        script_hex: z.string(),
        is_from_coinbase: z.boolean(),
        is_spendable: z.boolean().or(z.null()),
        is_spent: z.boolean(),
        spending_block_id: z.number().pipe(z.coerce.bigint()),
        spending_transaction_id: z.number().pipe(z.coerce.bigint()),
        spending_index: z.number(),
        spending_transaction_hash: z.string(),
        spending_date: z.string(),
        spending_time: z.string(),
        spending_value_usd: z.number(),
        spending_sequence: z.number(),
        spending_signature_hex: z.string(),
        spending_witness: z.string(),
        lifespan: z.number().pipe(z.coerce.bigint()),
        cdd: z.number(),
      })
      .array(),
    outputs: z
      .object({
        block_id: z.number().pipe(z.coerce.bigint()),
        transaction_id: z.number().pipe(z.coerce.bigint()),
        index: z.number(),
        transaction_hash: z.string(),
        date: z.string(),
        time: z.string(),
        value: z.number().pipe(z.coerce.bigint()),
        value_usd: z.number(),
        recipient: z.string(),
        type: z.string(),
        script_hex: z.string(),
      })
      .array(),
  })
);

const BlockchairTransactionResponse = z.object({
  data: BlockchairTransactionData.or(z.tuple([])).nullable(),
  context: requestContextSchema,
});

type BlockchairTransactionResponse = z.infer<typeof BlockchairTransactionResponse>;

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
const TransactionBroadcastStatus = z.object({
  data: z
    .object({
      transaction_hash: z.string(),
    })
    .nullish(),
  context: requestContextSchema,
});

type TransactionBroadcastStatus = z.infer<typeof TransactionBroadcastStatus>;

export {
  BlockchairAddressesResponse,
  BlockchairTransactionResponse,
  BlockchairXpubResponse,
  TransactionBroadcastStatus,
  BlockchairUtxoData as UtxoWithMetadata,
};
