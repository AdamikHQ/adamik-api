import { AddressState, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { CHAINS } from "~/app/config/chains";
import { CosmosBalance } from "../backend/types";
import { fetchBalances, fetchIBCTokenTicker } from "../backend/node";
import { CosmosService } from ".";
import { CosmosParams } from "../types";

async function getAddressState(this: CosmosService, address: string): Promise<AddressState> {
  const balances: CosmosBalance[] = await fetchBalances(this.chainId, address);

  const chain = CHAINS[this.chainId];
  const chainParams = chain.params as CosmosParams;

  let nativeBalance = 0n;
  let tokenBalances: TokenAmount[] = []; // TODO type
  for (const item of balances) {
    if (item.denom === chainParams?.denom) {
      nativeBalance += BigInt(item.amount);
    } else if (item.denom.startsWith("ibc/")) {
      const tokenId = item.denom.slice(4);

      const ticker = await fetchIBCTokenTicker(this.chainId, tokenId);

      tokenBalances.push({
        value: item.amount,
        token: {
          chainId: this.chainId,
          type: TokenType.IBC,
          id: tokenId,
          name: ticker,
          ticker,
          decimals: chain.decimals,
        },
      });
    }
  }

  return {
    chainId: this.chainId,
    address,
    balances: {
      native: {
        available: nativeBalance,
      },
      tokens: tokenBalances,
    },
  };
}

export { getAddressState };
