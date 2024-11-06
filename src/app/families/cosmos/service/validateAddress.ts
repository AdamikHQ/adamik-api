import { isValidAddress } from "../logic";
import { CosmosService } from "../service";

async function validateAddress(this: CosmosService, address: string): Promise<boolean> {
  return isValidAddress(address, this.chainId);
}

export { validateAddress };
