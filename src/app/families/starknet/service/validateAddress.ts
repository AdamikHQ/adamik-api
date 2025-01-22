import { getChecksumAddress, validateChecksumAddress } from "starknet";
import { StarknetService } from "../service";

async function validateAddress(this: StarknetService, address: string): Promise<boolean> {
  return validateChecksumAddress(getChecksumAddress(address));
}

export { validateAddress };
