import { BroadcastStatus, ChainId } from "~/app/model/types_WIP";
import { client } from "../client";

async function broadcastTransaction(chainId: ChainId, signedTransaction: string): Promise<BroadcastStatus> {
  const status: BroadcastStatus = {};
  try {
    const hash = await client(chainId).sendRawTransaction(JSON.parse(signedTransaction));
    status.hash = hash;
  } catch (e) {
    status.error = {
      //code: "KO",
      message: `Transaction broadcast failed: ${e}`,
    };
  }
  return status;
}

export { broadcastTransaction };
