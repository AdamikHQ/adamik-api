import { AddressState } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";

async function getAddressState(address: string): Promise<AddressState> {
  const account = await fetchAccount(address);
  return { balances: { available: account.balance } };
}

export { getAddressState };
