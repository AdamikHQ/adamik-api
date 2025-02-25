import { AccountState, TokenAmount } from "~/app/model/types_WIP";
import { fetchBalance } from "../backend/node";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountState(this: EvmService, accountId: EvmAddress): Promise<AccountState> {
  // Native
  const nativeBalance = await fetchBalance(this.chainId, accountId);
  const result = {
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens: [] as TokenAmount[],
    },
  };
  try {
    const indexer = this.getIndexer();
    result.balances.tokens = await indexer.fetchAllERC20TokenAmounts(this.chainId, accountId);
  } catch {}
  return result;
}

export { getAccountState };
