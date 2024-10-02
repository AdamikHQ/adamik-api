import { BroadcastStatus } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { broadcast } from "../backend/node";

async function broadcastTransaction(this: EvmService, signedTransaction: string): Promise<BroadcastStatus> {
  return {
    hash: await broadcast(this.chainId, signedTransaction),
  };
}

export { broadcastTransaction };
