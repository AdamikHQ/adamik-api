import { AccountState, TokenAmount } from "~/app/model/types_WIP";
import { fetchAccount, fetchAccountTokensBalance } from "../backend/node";
import { SolanaService } from "../service";

async function getAccountState(this: SolanaService, accountId: string): Promise<AccountState> {
  const { balance } = await fetchAccount(accountId);
  const nativeBalanceTotal = BigInt(balance);

  let allTokenAmounts: TokenAmount[] = [];
  let nextPaginationToken: string | undefined = undefined;

  do {
    const { tokenAmounts, nextPaginationToken: nextToken } = await fetchAccountTokensBalance(
      accountId,
      nextPaginationToken
    );

    allTokenAmounts = [...allTokenAmounts, ...tokenAmounts];
    nextPaginationToken = nextToken ?? undefined;
  } while (nextPaginationToken !== undefined);

  return {
    balances: {
      native: {
        available: nativeBalanceTotal,
        total: nativeBalanceTotal,
      },
      tokens: allTokenAmounts,
    },
  };
}

export { getAccountState };
