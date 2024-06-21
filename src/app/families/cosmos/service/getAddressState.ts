import fs from "fs";
import path from "path";

import { AddressState, ChainId, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { CHAINS } from "~/app/config/chains";
import { CosmosBalance } from "../backend/types";
import { fetchBalances, fetchIBCTokenTicker } from "../backend/node";
import { CosmosService } from ".";
import { CosmosParams } from "../types";

type IBCTokenInfo = {
  denom: string;
  type: string;
  symbol: string;
  decimals: number;
};

const CHAINLIST_CHAIN_IDS: Map<ChainId, string> = new Map([[ChainId.COSMOSHUB, "cosmos"]]);

async function getAddressState(this: CosmosService, address: string): Promise<AddressState> {
  const balances: CosmosBalance[] = await fetchBalances(this.chainId, address);

  const chain = CHAINS[this.chainId];
  const chainParams = chain.params as CosmosParams;

  // TODO Make all this clean

  const chainlistId = CHAINLIST_CHAIN_IDS.get(this.chainId) || this.chainId;
  console.log("chainlistId:", chainlistId);
  //const tokensConfigFile = path.join(__dirname, `../../../config/tokens/cosmos/${this.chainId}.json`);
  //const chainAssets: IBCTokenInfo[] = JSON.parse(fs.readFileSync(tokensConfigFile, { encoding: "utf8" }));

  //const tokensConfigFile = require(`~/app/config/tokens/cosmos/${this.chainId}.json`);
  //console.log("XXX - chainAssets:", tokensConfigFile);

  //const chainAssets: IBCTokenInfo[] = JSON.parse(tokensConfigFile);
  const chainAssets: IBCTokenInfo[] = require(`~/app/config/tokens/cosmos/${chainlistId}.json`);
  //console.log("XXX - chainAssets:", chainAssets);

  let nativeBalance = 0n;
  let tokenBalances: TokenAmount[] = []; // TODO type
  for (const item of balances) {
    console.log("XXX - balance:", item.denom);
    if (item.denom === chainParams?.denom) {
      nativeBalance += BigInt(item.amount);
    } else if (item.denom.startsWith("ibc/")) {
      const tokenId = item.denom.slice(4);

      const token = chainAssets.find((token) => token.denom === item.denom);
      console.log("XXX - found token:", token);
      //const ticker = await fetchIBCTokenTicker(this.chainId, tokenId);

      if (token) {
        tokenBalances.push({
          value: item.amount,
          token: {
            chainId: this.chainId,
            type: TokenType.IBC,
            id: tokenId,
            name: token.symbol,
            ticker: token.symbol,
            decimals: token.decimals,
          },
        });
      }
    } else {
      // throw
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
