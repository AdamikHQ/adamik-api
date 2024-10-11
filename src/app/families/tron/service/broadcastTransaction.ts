import { BroadcastStatus } from "~/app/model/types_WIP";
import { TronService } from ".";
import { broadcast } from "../backend/node";

async function broadcastTransaction(this: TronService, signedTransaction: string): Promise<BroadcastStatus> {
  return {
    hash: await broadcast(signedTransaction),
  };
}

export { broadcastTransaction };
