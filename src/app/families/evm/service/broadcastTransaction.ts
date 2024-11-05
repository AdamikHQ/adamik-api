import { BroadcastStatus } from "~/app/model/types_WIP";
import { broadcast } from "../backend/node";
import { EvmService } from "../service";

async function broadcastTransaction(this: EvmService, signedTransaction: string): Promise<BroadcastStatus> {
  return {
    hash: await broadcast(this.chainId, signedTransaction),
  };
}

export { broadcastTransaction };
