import { AddressState } from "~/app/model/types_WIP";
import { fetchBalance } from "../backend/node";

async function getAddressState(address: string): Promise<AddressState> {
  const balance = await fetchBalance(address);
  return { balances: { available: balance } };
}

export { getAddressState };
