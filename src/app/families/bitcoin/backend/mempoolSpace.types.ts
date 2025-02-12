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
    block_height: z.number(),
    block_hash: z.string(),
    block_time: z.number(),
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

export { mempoolSpaceAddressValidationSchema, mempoolSpaceFeesSchema, mempoolSpaceUtxoSchema };
export type { MempoolSpaceUTXO };
