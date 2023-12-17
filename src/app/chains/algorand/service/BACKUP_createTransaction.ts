import { Transaction, TransactionMode } from "~/app/model/transaction";
import { ChainId } from "~/app/model/chain";

function createTransaction(mode: TransactionMode): Transaction {
  return {
    mode,
    chain: ChainId.ALGORAND,
    senders: [],
    recipients: [],
    amount: bigint(0),
    fees: bigint(0),
    options: {
      maxAmount: false,
    },
  };
}

export { createTransaction };
