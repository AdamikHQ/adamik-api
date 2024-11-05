import { isValidAddress, isValidXpub } from "../logic";
import { BitcoinService } from "../service";

async function validateAddress(this: BitcoinService, address: string): Promise<boolean> {
  return isValidXpub(this.chainId, address) || isValidAddress(this.chainId, address);
}

export { validateAddress };
