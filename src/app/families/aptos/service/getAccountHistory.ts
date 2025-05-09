import { AccountHistory, FinalizedTransaction, Paginated, TransactionState } from "~/app/model/types_WIP";
import { getAccountTransactions } from "~/app/families/aptos/backend/node";
import { AptosService } from "~/app/families/aptos/service";
import { aptosToAdamikTransaction, getAmount, getTransactionMode } from "~/app/families/aptos/logic";

export async function getAccountHistory(
  this: AptosService,
  address: string
): Promise<Paginated<AccountHistory>> {
  const transactions = await getAccountTransactions(this.chainId, address);

  return {
    transactions: transactions.map((tx) => aptosToAdamikTransaction(tx)),
    pagination: {
      nextPage: null,
    },
  };
}
