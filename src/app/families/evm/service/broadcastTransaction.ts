import { BroadcastStatus } from "~/app/model/types_WIP";
import { client } from "../client";
import { EvmService } from ".";

async function broadcastTransaction(this: EvmService, signedTransaction: string): Promise<BroadcastStatus> {
  const status: BroadcastStatus = {};
  try {
    const hash = await client(this.chainId).sendRawTransaction(JSON.parse(signedTransaction));
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
