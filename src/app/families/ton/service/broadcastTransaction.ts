import { broadcast } from "../backend/node";
import { TonService } from "../service";

async function broadcastTransaction(this: TonService, signedTransaction: string): Promise<string> {
  return await broadcast(signedTransaction);
}

export { broadcastTransaction };
