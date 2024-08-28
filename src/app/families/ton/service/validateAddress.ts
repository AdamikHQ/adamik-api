import { Address } from "@ton/core";
import { TonService } from ".";

// Found  this source but not sure it's 100% efficient
// https://answers.ton.org/question/1534294957110595584/what-is-a-regular-expression-to-check-ton-addresses
async function validateAddress(this: TonService, address: string): Promise<boolean> {
  try {
    Address.parse(address);
    return true;
  }
  catch (e) { return false; }
}

export { validateAddress };

