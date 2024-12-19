import { broadcast } from "../backend/node";
import { EvmService } from "../service";

async function broadcastTransaction(this: EvmService, signedTransaction: string): Promise<string> {
  return await broadcast(this.chainId, signedTransaction);
}

export { broadcastTransaction };
