import { AddressState, TokenAmount } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";
import { AlgorandService } from ".";

async function getAddressState(this: AlgorandService, address: string): Promise<AddressState> {
  const { balance: nativeBalance, assetAmounts } = await fetchAccount(address);

  const tokenAmounts: TokenAmount[] = [];
  for (const assetAmount of assetAmounts) {
    tokenAmounts.push({
      tokenId: assetAmount.assetId,
      value: assetAmount.amount,
    });
  }

  return {
    chainId: this.chainId,
    balances: {
      native: {
        available: nativeBalance,
      },
      tokens: tokenAmounts,
    },
  };
}

export { getAddressState };
