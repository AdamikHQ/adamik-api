import { AddressState, Amount } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";
import { AlgorandService } from ".";
import { CHAINS } from "~/app/config/chains";

async function getAddressState(this: AlgorandService, address: string): Promise<AddressState> {
  const { balance } = await fetchAccount(address);

  const nativeAmount: Amount = {
    unit: CHAINS[this.chainId].unit,
    value: balance,
  };

  return { chainId: this.chainId, balances: { native: { available: nativeAmount } } };
}

export { getAddressState };
