import { BroadcastStatus } from "~/app/model/types_WIP";
import { broadcast } from "../backend/node";
import { TronService } from "../service";

async function broadcastTransaction(this: TronService, signedTransaction: string): Promise<BroadcastStatus> {
  return {
    hash: await broadcast(signedTransaction),
  };
}

export { broadcastTransaction };
