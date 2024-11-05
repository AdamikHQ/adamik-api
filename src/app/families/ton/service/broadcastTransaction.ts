import { BroadcastStatus } from "~/app/model/types_WIP";
import { broadcast } from "../backend/node";
import { TonService } from "../service";

async function broadcastTransaction(this: TonService, signedTransaction: string): Promise<BroadcastStatus> {
  return {
    hash: await broadcast(signedTransaction),
  };
}

export { broadcastTransaction };
