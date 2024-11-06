import { BroadcastStatus } from "~/app/model/types_WIP";
import { broadcast } from "../backend/node";
import { AlgorandService } from "../service";

async function broadcastTransaction(
  this: AlgorandService,
  signedTransaction: string
): Promise<BroadcastStatus> {
  return {
    hash: await broadcast(Buffer.from(signedTransaction, "hex")),
  };
}

export { broadcastTransaction };
