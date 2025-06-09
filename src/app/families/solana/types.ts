import { z } from "zod";

type SolanaTransactionParams = z.infer<typeof SolanaTransactionParamsSchema>;

const SolanaTransactionParamsSchema = z.object({
  publicKey: z.string(),
  signature: z.string(),
});

export { SolanaTransactionParamsSchema, type SolanaTransactionParams };
