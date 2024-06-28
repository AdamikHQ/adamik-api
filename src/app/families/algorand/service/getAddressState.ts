import { AddressState, TokenAmount } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";
import { AlgorandService } from ".";

async function getAddressState(this: AlgorandService, address: string): Promise<AddressState> {
  const { balance: nativeBalance, assetAmounts } = await fetchAccount(address);

  const tokenAmounts: TokenAmount[] = [];

  const tokenDetailsPromises = assetAmounts.map((assetAmount) => {
    return this.getTokenInfo(assetAmount.assetId);
  });

  const tokenDetails = await Promise.all(tokenDetailsPromises);

  tokenDetails.forEach((tokenDetail, index) => {
    if (tokenDetail) tokenAmounts.push({ token: tokenDetail, amount: assetAmounts[index].amount });
  });

  return {
    chainId: this.chainId,
    address,
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens: tokenAmounts,
    },
  };
}

export { getAddressState };
