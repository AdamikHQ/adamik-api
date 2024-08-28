import { z } from "zod";

type TonTransactionParams = z.infer<typeof tonTransactionParamsSchema>;

const tonTransactionParamsSchema = z.object({
  pubKey: z.string().optional(),
});


export type { TonTransactionParams };


export { tonTransactionParamsSchema };

