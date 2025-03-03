import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountHistory(
  this: EvmService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  const indexer = this.getIndexer();
  const { evmTransactions, nextPage } = await indexer.fetchAccountTransactions(
    this.chainId,
    accountId as EvmAddress,
    paginationToken
  );

  return {
    transactions: evmTransactions,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountHistory };
