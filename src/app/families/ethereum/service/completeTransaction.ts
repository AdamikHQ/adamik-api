import { ChainId, PlainTransaction } from "~/app/model/types_WIP";
import { client } from "../client";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

async function completeTransaction(
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  return {
    ...transaction,
  };
}

export { completeTransaction };
