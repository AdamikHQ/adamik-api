import { z } from "zod";

const tonTransactionParamsPayloadSchema = z.object({
  timeout: z.number(),
});

export { tonTransactionParamsPayloadSchema };

type TonTransactionParams = z.infer<typeof tonTransactionParamsPayloadSchema>;

export type { TonTransactionParams };
