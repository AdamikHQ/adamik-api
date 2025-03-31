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

type MempoolSpaceAddressBalance = z.infer<typeof mempoolSpaceAddressBalanceSchema>;

export {
  mempoolSpaceAddressBalanceSchema,
  mempoolSpaceAddressValidationSchema,
  mempoolSpaceFeesSchema,
  mempoolSpaceUtxoSchema,
};
export type { MempoolSpaceAddressBalance, MempoolSpaceUTXO };
