import { AccountAddress } from "@aptos-labs/ts-sdk";

export function validateAddress(address: string): Promise<boolean> {
  return Promise.resolve(AccountAddress.isValid({ input: address }).valid);
}
