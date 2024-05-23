import { AddressState, Amount, Unit } from "~/app/model/types_WIP";
import { fetchAccount, fetchASA } from "../backend/node";
import { AlgorandService } from ".";
import { CHAINS } from "~/app/config/chains";

async function getAddressState(this: AlgorandService, address: string): Promise<AddressState> {
  const { balance, assetAmounts } = await fetchAccount(address);

  // Native
  const nativeAmount: Amount = {
    unit: CHAINS[this.chainId].unit,
    value: balance,
  };

  // Tokens
  const tokenAmounts: Amount[] = [];
  for (const assetAmount of assetAmounts) {
    const tokenBalance = assetAmount.amount;

    // Fetch details about the token from its assetId
    const asset = await fetchASA(assetAmount.assetId);

    const tokenUnit: Unit = {
      id: asset.name,
      tag: asset.unitName,
      decimals: asset.decimals,
    };

    tokenAmounts.push({
      unit: tokenUnit,
      value: tokenBalance,
    });
  }

  return { chainId: this.chainId, balances: { native: { available: nativeAmount }, tokens: tokenAmounts } };
}

export { getAddressState };
