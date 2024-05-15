import { isAddress } from "viem";
import { EvmService } from ".";

async function validateAddress(this: EvmService, address: string): Promise<boolean> {
  return isAddress(address);
}

export { validateAddress };
