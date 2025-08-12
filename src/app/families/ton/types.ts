import { z } from "zod";

const tonTransactionParamsPayloadSchema = z.object({
  timeout: z.number(),
});

type TonTransactionParamsPayload = z.infer<typeof tonTransactionParamsPayloadSchema>;

export { tonTransactionParamsPayloadSchema };
export type { TonTransactionParamsPayload };
