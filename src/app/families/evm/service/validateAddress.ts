import { isAddress } from "viem";
import { EvmService } from "../service";

async function validateAddress(this: EvmService, address: string): Promise<boolean> {
  return isAddress(address, { strict: false });
}

export { validateAddress };
