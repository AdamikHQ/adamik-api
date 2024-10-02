import { BroadcastStatus } from "~/app/model/types_WIP";
import { TonService } from ".";
import { broadcast } from "../backend/node";

async function broadcastTransaction(this: TonService, signedTransaction: string): Promise<BroadcastStatus> {
  return {
    hash: await broadcast(signedTransaction),
  };
}

export { broadcastTransaction };
