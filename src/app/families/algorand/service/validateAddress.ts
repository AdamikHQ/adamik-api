import { isValidAddress } from "algosdk";
import { AlgorandService } from ".";

async function validateAddress(this: AlgorandService, address: string): Promise<boolean> {
  return isValidAddress(address);
}

export { validateAddress };
