import { BroadcastStatus, ChainId } from "~/app/model/types_WIP";
import { broadcastTransaction as broadcast } from "../backend/node";

async function broadcastTransaction(chainId: ChainId, signedTransaction: string): Promise<BroadcastStatus> {
  const status: BroadcastStatus = {};
  try {
    const payload = JSON.stringify({
      tx_bytes: Array.from(Uint8Array.from(Buffer.from(signedTransaction, "hex"))),
      mode: "BROADCAST_MODE_SYNC",
    });

    status.hash = await broadcast(chainId, payload);
  } catch (e) {
    status.error = {
      //code: "KO",
      message: `Transaction broadcast failed: ${e}`,
    };
  }
  return status;
}

export { broadcastTransaction };
