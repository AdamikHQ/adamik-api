import { broadcast } from "../backend/node";
import { StarknetService } from "../service";

async function broadcastTransaction(this: StarknetService, signedTransaction: string): Promise<string> {
  return await broadcast(this.chainId, signedTransaction);
}

export { broadcastTransaction };
