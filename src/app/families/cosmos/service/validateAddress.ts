import { isValidAddress } from "../logic";

async function validateAddress(address: string): Promise<boolean> {
  return isValidAddress(address);
}

export { validateAddress };
