import { AddressState } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";
import { AlgorandService } from ".";

async function getAddressState(this: AlgorandService, address: string): Promise<AddressState> {
  const account = await fetchAccount(address);
  return { balances: { available: account.balance } };
}

export { getAddressState };
