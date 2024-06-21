import { AddressState, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { CHAINS } from "~/app/config/chains";
import { COSMOS_TOKENS } from "~/app/config/tokens/cosmos";
import { CosmosBalance } from "../backend/types";
import { fetchBalances } from "../backend/node";
import { CosmosService } from ".";
import { CosmosParams, IBCToken } from "../types";

async function getAddressState(this: CosmosService, address: string): Promise<AddressState> {
  const balances: CosmosBalance[] = await fetchBalances(this.chainId, address);

  const chain = CHAINS[this.chainId];
  const chainParams = chain.params as CosmosParams;

  let nativeBalance = 0n;
  let tokenBalances: TokenAmount[] = [];
  for (const item of balances) {
    if (item.denom === chainParams?.denom) {
      nativeBalance += BigInt(item.amount);
    } else if (item.denom.startsWith("ibc/")) {
      const token = COSMOS_TOKENS.find((token) => token.denom === item.denom) as IBCToken;

      if (token) {
        tokenBalances.push({
          value: item.amount,
          token: {
            chainId: this.chainId,
            type: TokenType.IBC,
            id: token.denom,
            name: token.symbol,
            ticker: token.symbol,
            decimals: token.decimals,
          },
        });
      } else {
        console.warn(`/!\\ Could not find info about IBC token '${item.denom}':`);
      }
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
