import { AddressState } from "~/app/model/types_WIP";
import { fetchBalance } from "../backend/node";
import { CosmosService } from ".";

async function getAddressState(this: CosmosService, address: string): Promise<AddressState> {
  const balance = await fetchBalance(this.chainId, address);
  return { balances: { available: balance } };
}

export { getAddressState };
