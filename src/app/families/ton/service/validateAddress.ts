import { TonService } from ".";
import { isAddressValid } from "../logic";

async function validateAddress(this: TonService, address: string): Promise<boolean> {
  return isAddressValid(address);
}

export { validateAddress };
