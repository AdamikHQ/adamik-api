import { AccountHistory, AccountHistoryPagination, FinalizedTransaction } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { fetchAccountTransactions, moralisToAdamikAccountTransaction } from "../backend/moralis";
import { EvmAddress } from "../types";

async function getAccountHistory(
  this: EvmService,
  accountId: string,
  pagination: AccountHistoryPagination
): Promise<AccountHistory> {
  const evmTransactions = await fetchAccountTransactions(this.chainId, accountId as EvmAddress, pagination);

  const transactions: FinalizedTransaction[] = [];

  for (const evmTransaction of evmTransactions) {
    const parsedTransaction = moralisToAdamikAccountTransaction(this.chainId, evmTransaction);

    transactions.push({
      parsed: parsedTransaction,
      raw: evmTransaction,
    });
  }

  return {
    chainId: this.chainId,
    accountId,
    transactions,
  };
}

export { getAccountHistory };
