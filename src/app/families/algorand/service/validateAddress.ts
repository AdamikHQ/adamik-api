import { isValidAddress } from "algosdk";
import { ChainId } from "~/app/model/types_WIP";

async function validateAddress(chainId: ChainId, address: string): Promise<boolean> {
  return isValidAddress(address);
}

export { validateAddress };
