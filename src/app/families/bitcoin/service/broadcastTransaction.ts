import { BroadcastStatus } from "~/app/model/types_WIP";
import { BitcoinService } from ".";
import { postTransaction } from "../backend/explorer";

async function broadcastTransaction(
  this: BitcoinService,
  signedTransaction: string
): Promise<BroadcastStatus> {
  try {
    return {
      hash: await postTransaction(this.chainId, signedTransaction),
    };
  } catch (e: any) {
    return {
      error: {
        message: e.message,
      },
    };
  }
}

export { broadcastTransaction };
