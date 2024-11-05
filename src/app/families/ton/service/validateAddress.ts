import { isAddressValid } from "../logic";
import { TonService } from "../service";

async function validateAddress(this: TonService, address: string): Promise<boolean> {
  return isAddressValid(address);
}

export { validateAddress };
