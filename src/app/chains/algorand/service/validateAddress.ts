import { isValidAddress } from "algosdk";

function validateAddress(address: string): boolean {
  return isValidAddress(address);
}

export { validateAddress };
