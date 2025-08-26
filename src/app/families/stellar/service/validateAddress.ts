import { isValidAddress } from "../logic";
import { StellarService } from "../service";

async function validateAddress(this: StellarService, address: string): Promise<boolean> {
  return isValidAddress(address);
}

export { validateAddress };
