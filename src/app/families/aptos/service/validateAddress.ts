import { AccountAddress } from "@aptos-labs/ts-sdk";

export async function validateAddress(address: string): Promise<boolean> {
  return AccountAddress.isValid({ input: address }).valid;
}
