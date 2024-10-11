import { z } from "zod";

const tonTransactionParamsSchema = z
  .object({
    pubKey: z.string().optional(),
  })
  .optional();

type TonTransactionParams = z.infer<typeof tonTransactionParamsSchema>;

export type { TonTransactionParams };

export { tonTransactionParamsSchema };
