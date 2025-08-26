import { broadcastTransaction as broadcast } from "../backend/horizon";
import { StellarService } from "../service";

async function broadcastTransaction(this: StellarService, signedTransaction: string): Promise<string> {
  return await broadcast(signedTransaction, this.chainId);
}

export { broadcastTransaction };
