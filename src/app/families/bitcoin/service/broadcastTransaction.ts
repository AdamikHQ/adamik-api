import { BroadcastStatus } from "~/app/model/types_WIP";
import { BtcService } from ".";

async function broadcastTransaction(this: BtcService, signedTransaction: string): Promise<BroadcastStatus> {
  throw new Error("Not implemented");
}

export { broadcastTransaction };
