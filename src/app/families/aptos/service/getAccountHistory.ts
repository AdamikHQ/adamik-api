import { AccountHistory, FinalizedTransaction, Paginated, TransactionState } from "~/app/model/types_WIP";
import { getAccountTransactions } from "~/app/families/aptos/backend/node";
import { AptosService } from "~/app/families/aptos/service";
import { getAmount, getTransactionMode } from "~/app/families/aptos/logic";

export async function getAccountHistory(
  this: AptosService,
  address: string
): Promise<Paginated<AccountHistory>> {
  const transactions = await getAccountTransactions(this.chainId, address);

  return {
    transactions: transactions.map((tx) => ({
      parsed: {
        id: tx.hash,
        mode: getTransactionMode(tx),
        state: TransactionState.CONFIRMED,
        fees: {
          amount: BigInt(tx.gas_used) * BigInt(tx.gas_unit_price),
        },
        senders: [
          {
            address: tx.sender,
            amount: getAmount(tx),
          },
        ],
        recipients: [],
      },
      raw: tx,
    })),
    pagination: {
      nextPage: null,
    },
  };
}
