import { BroadcastStatus } from "~/app/model/types_WIP";
import { broadcast } from "../backend/node";
import { AlgorandService } from ".";

async function broadcastTransaction(
  this: AlgorandService,
  signedTransaction: string
): Promise<BroadcastStatus> {
  try {
    return {
      hash: await broadcast(Buffer.from(signedTransaction, "hex"))
    };
  } catch {
    return {
      error: {
        //code: "KO",
        message: "Transaction broadcast failed",
      }
    };
  }
}

export { broadcastTransaction };
