import { BroadcastStatus } from "~/app/model/types_WIP";
import { broadcastTransaction as broadcast } from "../backend/node";
import { CosmosService } from ".";

async function broadcastTransaction(
  this: CosmosService,
  signedTransaction: string
): Promise<BroadcastStatus> {
  try {
    const payload = JSON.stringify({
      tx_bytes: Array.from(Uint8Array.from(Buffer.from(signedTransaction, "hex"))),
      mode: "BROADCAST_MODE_SYNC",
    });

    return {
      hash: await broadcast(this.chainId, payload)
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
