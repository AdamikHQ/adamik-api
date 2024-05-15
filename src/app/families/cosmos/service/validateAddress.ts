import { isValidAddress } from "../logic";
import { CosmosService } from ".";

async function validateAddress(this: CosmosService, address: string): Promise<boolean> {
  return isValidAddress(this.chainId, address);
}

export { validateAddress };
