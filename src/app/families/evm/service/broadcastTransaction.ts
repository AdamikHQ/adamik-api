import { BroadcastStatus } from "~/app/model/types_WIP";
import { broadcast } from "../backend/node";
import { EvmService } from ".";

async function broadcastTransaction(this: EvmService, signedTransaction: string): Promise<BroadcastStatus> {
  try {
    return {
      hash: await broadcast(this.chainId, signedTransaction)
    };
  } catch (e) {
    return {
      error: {
        //code: "KO",
        message: `Transaction broadcast failed: ${e}`,
      }
    };
  }
}

export { broadcastTransaction };
