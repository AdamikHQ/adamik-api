import { AddressState, ChainId } from "~/app/model/types_WIP";
import { fetchBalance } from "../backend/node";

async function getAddressState(chainId: ChainId, address: string): Promise<AddressState> {
  const balance = await fetchBalance(chainId, address);
  return { balances: { available: balance } };
}

export { getAddressState };
