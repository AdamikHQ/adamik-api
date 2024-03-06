import { isValidAddress } from "algosdk";

async function validateAddress(address: string): Promise<boolean> {
  return isValidAddress(address);
}

export { validateAddress };
