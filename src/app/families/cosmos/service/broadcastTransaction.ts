import { broadcastTransaction as broadcast } from "../backend/node";
import { CosmosService } from "../service";

async function broadcastTransaction(this: CosmosService, signedTransaction: string): Promise<string> {
  const payload = JSON.stringify({
    // TODO "tx_bytes" for Amino, "tx" for Protobuf
    tx: Array.from(Uint8Array.from(Buffer.from(signedTransaction, "hex"))),
    mode: "BROADCAST_MODE_SYNC",
  });

  return await broadcast(this.chainId, payload);
}

export { broadcastTransaction };
