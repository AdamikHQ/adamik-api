import { BroadcastStatus } from "~/app/model/types_WIP";
import { TonService } from ".";
import { broadcast } from "../backend/node";

async function broadcastTransaction(this: TonService, signedTransaction: string): Promise<BroadcastStatus> {
  try {
    return {
      hash: await broadcast(signedTransaction),
    };
  } catch {
    return {
      error: {
        //code: "KO",
        message: "Transaction broadcast failed",
      },
    };
  }
}

export { broadcastTransaction };
