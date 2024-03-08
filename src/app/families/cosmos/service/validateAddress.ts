import { ChainId } from "~/app/model/types_WIP";
import { isValidAddress } from "../logic";

async function validateAddress(chainId: ChainId, address: string): Promise<boolean> {
  return isValidAddress(chainId, address);
}

export { validateAddress };
