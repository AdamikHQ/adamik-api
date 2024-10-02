import { BroadcastStatus } from "~/app/model/types_WIP";
import { AlgorandService } from ".";
import { broadcast } from "../backend/node";

async function broadcastTransaction(
  this: AlgorandService,
  signedTransaction: string
): Promise<BroadcastStatus> {
  return {
    hash: await broadcast(Buffer.from(signedTransaction, "hex")),
  };
}

export { broadcastTransaction };
