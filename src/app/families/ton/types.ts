import { z } from "zod";

const tonTransactionParamsSchema = z.object({
  timeout: z.number(),
});

type TonTransactionParams = z.infer<typeof tonTransactionParamsSchema>;

export { tonTransactionParamsSchema };
export type { TonTransactionParams };
