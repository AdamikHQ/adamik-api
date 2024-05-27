import { AddressState } from "~/app/model/types_WIP";
import { fetchBalance } from "../backend/node";
import { CosmosService } from ".";

async function getAddressState(this: CosmosService, address: string): Promise<AddressState> {
  const nativeBalance = await fetchBalance(this.chainId, address);

  return {
    chainId: this.chainId,
    balances: {
      native: {
        available: nativeBalance,
      },
    },
  };
}

export { getAddressState };
