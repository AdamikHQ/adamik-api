import { BroadcastStatus } from "~/app/model/types_WIP";
import { CosmosService } from ".";
import { broadcastTransaction as broadcast } from "../backend/node";

async function broadcastTransaction(
  this: CosmosService,
  signedTransaction: string
): Promise<BroadcastStatus> {
  const payload = JSON.stringify({
    tx_bytes: Array.from(Uint8Array.from(Buffer.from(signedTransaction, "hex"))),
    mode: "BROADCAST_MODE_SYNC",
  });

  return {
    hash: await broadcast(this.chainId, payload),
  };
}

export { broadcastTransaction };
