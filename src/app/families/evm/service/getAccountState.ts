import { AccountState, ProviderType, TokenAmount } from "~/app/model/types_WIP";
import { MoralisIndexer } from "../backend/moralis";
import { AlchemyIndexer } from "~/app/families/evm/backend/alchemy";
import { fetchBalance } from "../backend/node";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountState(this: EvmService, accountId: EvmAddress): Promise<AccountState> {
  // Native
  const nativeBalance = await fetchBalance(this.chainId, accountId);
  console.log({ nativeBalance });
  const result = {
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens: [] as TokenAmount[],
    },
  };
  let backend = this.getBackend(ProviderType.moralis);
  let indexer = MoralisIndexer;
  if (!backend) {
    backend = this.getBackend(ProviderType.alchemy);
    indexer = AlchemyIndexer;
  }
  if (backend && indexer) {
    result.balances.tokens = await indexer.fetchAllERC20TokenAmounts(this.chainId, accountId);
  }
  return result;
}

export { getAccountState };
