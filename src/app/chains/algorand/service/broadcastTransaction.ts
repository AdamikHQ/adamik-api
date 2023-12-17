import { BroadcastStatus } from "~/app/model/types_WIP";
import { broadcast } from "../backend/node";

async function broadcastTransaction(
  signedTransaction: string
): Promise<BroadcastStatus> {
  const status: BroadcastStatus = {};
  try {
    status.hash = await broadcast(Buffer.from(signedTransaction, "hex"));
  } catch {
    status.error = {
      code: "KO",
      message: "Transaction broadcast failed",
    };
  }
  return status;
}

export { broadcastTransaction };
