import { UTXO } from "coinselect";
import z from "zod";

const numberOrBigint = z.bigint().or(z.number().pipe(z.coerce.bigint()));

// Metadata that's part of all Blockchair responses
const BlockchairResponseContext = z.object({
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

const UtxoWithMetadata = z
  .object({
    block_id: z.number(),
    transaction_hash: z.string(),
    index: z.number(),
    value: z.number(),
    address: z.string(),
    script_hex: z.string().optional(),
  })
  .transform((data) => {
    return {
      /** Add fields for compatibility with coinselect @see {@link UTXO} */
      // NOTE The published 'UTXO' type from coinselect is WRONG!
      // The runtime data actually matches this UtxoWithMetadata type
      txid: data.transaction_hash,
      vout: data.index,
      ...data,
    };
  });

// (Partial type, only what we use)
const BlockchairStatsData = z.object({
  blocks: z.number(),
});

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

// https://blockchair.com/api/docs#link_300
const BlockchairAddressesResponse = z.object({
  data: z
    .object({
      addresses: z.record(z.string(), BlockchairAddressData),
      transactions: z.array(z.string()),
      utxo: UtxoWithMetadata.array(),
    })
    .nullable(),
  context: BlockchairResponseContext,
});

const BlockchairXpubData = z.object({
  xpub: z.object({
    address_count: z.number(),
    balance: numberOrBigint,
    balance_usd: z.number(),
    received: numberOrBigint,
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
  utxo: UtxoWithMetadata.array(),
});

// https://blockchair.com/api/docs#link_300
const BlockchairXpubResponse = z.object({
  data: z.record(z.string(), BlockchairXpubData),
  // FIXME Was all this mess needed?...
  // data: z
  //   .record(z.string(), BlockchairXpubData)
  //   .or(z.tuple([]))
  //   .nullable()
  //   .transform((data) => (!data || Array.isArray(data) ? {} : data))
  //   .pipe(z.record(z.string(), BlockchairXpubData)),
  context: BlockchairResponseContext.and(
    z.object({
      // List of all addresses checked by Blockchair for the given xpub
      checked: z.array(z.string()),
    })
  ),
});

const BlockchairTransactionData = z.object({
  transaction: z.object({
    block_id: z.number(),
    id: numberOrBigint,
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
    input_total: numberOrBigint,
    input_total_usd: z.number(),
    output_total: numberOrBigint,
    output_total_usd: z.number(),
    fee: numberOrBigint,
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
      block_id: numberOrBigint,
      transaction_id: numberOrBigint,
      index: z.number(),
      transaction_hash: z.string(),
      date: z.string(),
      time: z.string(),
      value: numberOrBigint,
      value_usd: z.number(),
      recipient: z.string(),
      type: z.string(),
      script_hex: z.string(),
      is_from_coinbase: z.boolean(),
      is_spendable: z.boolean().or(z.null()),
      is_spent: z.boolean(),
      spending_block_id: numberOrBigint,
      spending_transaction_id: numberOrBigint,
      spending_index: z.number(),
      spending_transaction_hash: z.string(),
      spending_date: z.string(),
      spending_time: z.string(),
      spending_value_usd: z.number(),
      spending_sequence: z.number(),
      spending_signature_hex: z.string(),
      spending_witness: z.string(),
      lifespan: numberOrBigint,
      cdd: z.number(),
    })
    .array(),
  outputs: z
    .object({
      block_id: numberOrBigint,
      transaction_id: numberOrBigint,
      index: z.number(),
      transaction_hash: z.string(),
      date: z.string(),
      time: z.string(),
      value: numberOrBigint,
      value_usd: z.number(),
      recipient: z.string(),
      type: z.string(),
      script_hex: z.string(),
    })
    .array(),
});

// https://blockchair.com/api/docs#link_200
const BlockchairTransactionsResponse = z.object({
  data: z.record(z.string(), BlockchairTransactionData),
  // FIXME Was this really needed?...
  //data: z.record(z.string(), BlockchairTransactionData).or(z.tuple([])).nullable(),
  context: BlockchairResponseContext,
});

const BlockchairRawTransactionData = z.object({
  raw_transaction: z.string(),
  decoded_raw_transaction: z.object({
    txid: z.string(),
    hash: z.string(),
    version: z.number(),
    size: z.number(),
    vsize: z.number(),
    weight: z.number(),
    locktime: z.number(),
    vin: z
      .object({
        txid: z.string(),
        vout: z.number(),
        scriptSig: z.object({
          asm: z.string(),
          hex: z.string(),
        }),
        txinwitness: z.string().array().optional(),
        sequence: z.number(),
      })
      .array(),
    vout: z
      .object({
        value: z.number(),
        n: z.number(),
        scriptPubKey: z.object({
          asm: z.string(),
          hex: z.string(),
          address: z.string(),
          type: z.string(),
          addresses: z.string().array(),
          reqSigs: z.number(),
        }),
      })
      .array(),
  }),
});

const BlockchairRawTransactionResponse = z.object({
  data: z.record(z.string(), BlockchairRawTransactionData),
  context: BlockchairResponseContext,
});

// https://blockchair.com/api/docs#link_202
const BlockchairTransactionBroadcastStatus = z.object({
  data: z
    .object({
      transaction_hash: z.string(),
    })
    .nullish(),
  context: BlockchairResponseContext,
});

type BlockchairResponseContext = z.infer<typeof BlockchairResponseContext>;
type UtxoWithMetadata = z.infer<typeof UtxoWithMetadata>;
type BlockchairStatsData = z.infer<typeof BlockchairStatsData>;

type BlockchairAddressData = z.infer<typeof BlockchairAddressData>;
type BlockchairAddressesResponse = z.infer<typeof BlockchairAddressesResponse>;

type BlockchairXpubData = z.infer<typeof BlockchairXpubData>;
type BlockchairXpubResponse = z.infer<typeof BlockchairXpubResponse>;

type BlockchairTransactionData = z.infer<typeof BlockchairTransactionData>;
type BlockchairTransactionsResponse = z.infer<typeof BlockchairTransactionsResponse>;

type BlockchairRawTransactionData = z.infer<typeof BlockchairRawTransactionData>;
type BlockchairRawTransactionResponse = z.infer<typeof BlockchairRawTransactionResponse>;

type BlockchairTransactionBroadcastStatus = z.infer<typeof BlockchairTransactionBroadcastStatus>;

export {
  BlockchairAddressData,
  BlockchairAddressesResponse,
  BlockchairRawTransactionData,
  BlockchairRawTransactionResponse,
  BlockchairResponseContext,
  BlockchairStatsData,
  BlockchairTransactionBroadcastStatus,
  BlockchairTransactionData,
  BlockchairTransactionsResponse,
  BlockchairXpubData,
  BlockchairXpubResponse,
  UtxoWithMetadata,
};
