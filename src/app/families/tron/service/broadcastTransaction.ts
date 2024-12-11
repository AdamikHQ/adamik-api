import { broadcast } from "../backend/node";
import { TronService } from "../service";

async function broadcastTransaction(this: TronService, signedTransaction: string): Promise<string> {
  return await broadcast(signedTransaction);
}

export { broadcastTransaction };
