import { BtcService } from ".";
import { isValidAddress, isValidXpub } from "../logic";

async function validateAddress(this: BtcService, address: string): Promise<boolean> {
  return isValidXpub(this.chainId, address) || isValidAddress(this.chainId, address);
}

export { validateAddress };
