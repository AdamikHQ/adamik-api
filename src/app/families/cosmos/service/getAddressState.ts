import { AddressState, Amount } from "~/app/model/types_WIP";
import { fetchBalance } from "../backend/node";
import { CosmosService } from ".";
import { CHAINS } from "~/app/config/chains";

async function getAddressState(this: CosmosService, address: string): Promise<AddressState> {
  const nativeBalance = await fetchBalance(this.chainId, address);

  const nativeAmount: Amount = {
    unit: CHAINS[this.chainId].unit,
    value: nativeBalance,
  };

  return { chainId: this.chainId, balances: { native: { available: nativeAmount } } };
}

export { getAddressState };
