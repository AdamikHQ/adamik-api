import { broadcastTransaction as broadcastTransactionFn } from "../backend/node";
import { SolanaService } from "../service";

async function broadcastTransaction(this: SolanaService, signedTransaction: string): Promise<string> {
  return await broadcastTransactionFn(this.chainId, signedTransaction);
}

export { broadcastTransaction };
