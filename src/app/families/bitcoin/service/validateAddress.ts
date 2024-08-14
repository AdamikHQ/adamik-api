import { BtcService } from ".";
import { isValidAddress, isValidXpub } from "../logic";

async function validateAddress(this: BtcService, address: string): Promise<boolean> {
  return isValidXpub(address) || isValidAddress(address, this.chainId);
}

export { validateAddress };
