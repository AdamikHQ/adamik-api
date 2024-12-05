import { FinalizedTransaction } from "~/app/model/types_WIP";
import { StarknetService } from "../service";

async function getTransaction(this: StarknetService, transactionId: string): Promise<FinalizedTransaction> {
  throw new Error("Not implemented");
}

export { getTransaction };
