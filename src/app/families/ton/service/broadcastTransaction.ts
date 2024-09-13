import { BroadcastStatus } from "~/app/model/types_WIP";
import { TonService } from ".";
import { broadcast } from "../backend/node";

async function broadcastTransaction(this: TonService, signedTransaction: string): Promise<BroadcastStatus> {
  const status: BroadcastStatus = {};
  try {
    status.hash = await broadcast(signedTransaction);
  } catch {
    status.error = {
      //code: "KO",
      message: "Transaction broadcast failed",
    };
  }
  return status;
}

export { broadcastTransaction };
