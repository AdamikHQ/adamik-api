import { z } from "zod";

const mempoolSpaceFeesSchema = z.object({
  fastestFee: z.number(),
  halfHourFee: z.number(),
  hourFee: z.number(),
  economyFee: z.number(),
  minimumFee: z.number(),
});

const mempoolSpaceUtxoSchema = z.object({
  txid: z.string(),
  vout: z.number(),
  status: z.object({
    confirmed: z.boolean(),
    block_height: z.number().optional(),
    block_hash: z.string().optional(),
    block_time: z.number().optional(),
  }),
  value: z.number(),
});

type MempoolSpaceUTXO = z.infer<typeof mempoolSpaceUtxoSchema>;

const mempoolSpaceAddressValidationSchema = z.object({
  isvalid: z.boolean(),
  address: z.string(),
  scriptPubKey: z.string(),
  isscript: z.boolean(),
  iswitness: z.boolean(),
});

// Schema for the address balance response
const mempoolSpaceAddressBalanceSchema = z.object({
  address: z.string(),
  chain_stats: z.object({
    funded_txo_count: z.number(),
    funded_txo_sum: z.number(),
    spent_txo_count: z.number(),
    spent_txo_sum: z.number(),
    tx_count: z.number(),
  }),
  mempool_stats: z.object({
    funded_txo_count: z.number(),
    funded_txo_sum: z.number(),
    spent_txo_count: z.number(),
    spent_txo_sum: z.number(),
    tx_count: z.number(),
  }),
});

// Schema for the transaction response
const mempoolSpaceTransactionSchema = z.object({
  txid: z.string(),
  version: z.number(),
  locktime: z.number(),
  size: z.number(),
  weight: z.number(),
  fee: z.number(),
  status: z.object({
    confirmed: z.boolean(),
    block_height: z.number().optional(),
    block_hash: z.string().optional(),
    block_time: z.number().optional(),
  }),
  vin: z.array(
    z.object({
      txid: z.string(),
      vout: z.number(),
      prevout: z.object({
        scriptpubkey: z.string(),
        scriptpubkey_asm: z.string(),
        scriptpubkey_type: z.string(),
        scriptpubkey_address: z.string().optional(),
        value: z.number(),
      }),
      scriptsig: z.string(),
      scriptsig_asm: z.string(),
      witness: z.array(z.string()).optional(),
      is_coinbase: z.boolean(),
      sequence: z.number(),
    })
  ),
  vout: z.array(
    z.object({
      scriptpubkey: z.string(),
      scriptpubkey_asm: z.string(),
      scriptpubkey_type: z.string(),
      scriptpubkey_address: z.string().optional(),
      value: z.number(),
    })
  ),
});

type MempoolSpaceAddressBalance = z.infer<typeof mempoolSpaceAddressBalanceSchema>;
type MempoolSpaceTransaction = z.infer<typeof mempoolSpaceTransactionSchema>;

export {
  mempoolSpaceAddressBalanceSchema,
  mempoolSpaceAddressValidationSchema,
  mempoolSpaceFeesSchema,
  mempoolSpaceTransactionSchema,
  mempoolSpaceUtxoSchema,
};

export type { MempoolSpaceAddressBalance, MempoolSpaceTransaction, MempoolSpaceUTXO };
