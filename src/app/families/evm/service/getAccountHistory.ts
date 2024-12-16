import { AccountHistory, FinalizedTransaction, Paginated } from "~/app/model/types_WIP";
import { fetchAccountTransactions, moralisToAdamikAccountTransaction } from "../backend/moralis";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountHistory(
  this: EvmService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  const { evmTransactions, nextPage } = await fetchAccountTransactions(
    this.chainId,
    accountId as EvmAddress,
    paginationToken
  );

  const transactions: FinalizedTransaction[] = [];

  for (const evmTransaction of evmTransactions) {
    const parsedTransaction = moralisToAdamikAccountTransaction(this.chainId, evmTransaction);

    transactions.push({
      parsed: parsedTransaction,
      raw: evmTransaction,
    });
  }

  return {
    transactions,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountHistory };
