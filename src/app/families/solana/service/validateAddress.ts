import { isAddressValid } from "../logic";
import { SolanaService } from "../service";

async function validateAddress(this: SolanaService, accountAddress: string) {
  return isAddressValid(accountAddress);
}

export { validateAddress };
