import { z } from "zod";

type SolanaTransactionParams = z.infer<typeof SolanaTransactionParamsSchema>;

const SolanaTransactionParamsSchema = z.string();

export { SolanaTransactionParamsSchema, type SolanaTransactionParams };
