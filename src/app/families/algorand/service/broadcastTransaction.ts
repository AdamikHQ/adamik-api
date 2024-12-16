import { broadcast } from "../backend/node";
import { AlgorandService } from "../service";

async function broadcastTransaction(this: AlgorandService, signedTransaction: string): Promise<string> {
  return await broadcast(Buffer.from(signedTransaction, "hex"));
}

export { broadcastTransaction };
