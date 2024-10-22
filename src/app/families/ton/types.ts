import { z } from "zod";
import { ChainFamily } from "~/app/model/types_WIP";

type TonTransactionParams = z.infer<typeof tonTransactionParamsSchema>;

const tonTransactionParamsSchema = z.object({
  kind: z.literal(ChainFamily.TON),
  pubKey: z.string().optional(),
});

export type { TonTransactionParams };

export { tonTransactionParamsSchema };
