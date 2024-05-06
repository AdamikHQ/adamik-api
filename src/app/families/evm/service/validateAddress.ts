import { ChainId } from "~/app/model/types_WIP";
import { isAddress } from "viem";

async function validateAddress(chainId: ChainId, address: string): Promise<boolean> {
  return isAddress(address);
}

export { validateAddress };
