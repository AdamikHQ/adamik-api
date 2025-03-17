import { z } from "zod";

type TonTransactionParams = z.infer<typeof tonTransactionParamsSchema>;
const tonTransactionParamsSchema = z.string();

const tonTransactionParamsPayloadSchema = z.object({
  timeout: z.number(),
});

export { tonTransactionParamsPayloadSchema, tonTransactionParamsSchema };

type TonTransactionParamsPayload = z.infer<typeof tonTransactionParamsPayloadSchema>;

export type { TonTransactionParams, TonTransactionParamsPayload };
