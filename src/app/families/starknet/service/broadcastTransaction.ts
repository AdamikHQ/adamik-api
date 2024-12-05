import { BroadcastStatus } from "~/app/model/types_WIP";
import { StarknetService } from "../service";

async function broadcastTransaction(
  this: StarknetService,
  signedTransaction: string
): Promise<BroadcastStatus> {
  throw new Error("Not implemented");
}

export { broadcastTransaction };
