import { z } from "zod";

const tronTransactionParamsSchema = z.object({
  visible: z.boolean().optional(),
  txID: z.string(),
  // FIXME 'raw_data' probably unneeded as 'raw_data_hex' is the same, so 'raw_data' can be retrieved from the hex string
  // 'raw_data_hex' being the value returned in 'transaction.encoded', both raw_data and raw_data_hex can probably be removed from here
  raw_data: z.object({
    contract: z.array(
      z.object({
        parameter: z.object({
          value: z.object({
            data: z.string().optional(),
            owner_address: z.string(),
            asset_name: z.string().optional(),
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
});

type TronTransactionParams = z.infer<typeof tronTransactionParamsSchema>;

export type { TronTransactionParams };

export { tronTransactionParamsSchema };
