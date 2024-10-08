import { z } from "zod";

const tronTransactionParamsSchema = z
  .object({
    visible: z.boolean().optional(),
    txID: z.string(),
    raw_data: z.object({
      contract: z.array(
        z.object({
          parameter: z.object({
            value: z.object({
              data: z.string().optional(),
              owner_address: z.string(),
              contract_address: z.string().optional(),
              to_address: z.string().optional(),
              amount: z.number().optional(),
            }),
            type_url: z.string(),
          }),
          type: z.string(),
        })
      ),
      ref_block_bytes: z.string(),
      ref_block_hash: z.string(),
      expiration: z.number(),
      fee_limit: z.number().optional(),
      timestamp: z.number(),
    }),
    raw_data_hex: z.string(),
  })
  .optional();

type TronTransactionParams = z.infer<typeof tronTransactionParamsSchema>;

export type { TronTransactionParams };

export { tronTransactionParamsSchema };
