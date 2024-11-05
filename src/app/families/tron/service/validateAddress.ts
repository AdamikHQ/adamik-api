import { TronWeb } from "tronweb";
import { TronService } from "../service";

async function validateAddress(this: TronService, address: string): Promise<boolean> {
  return TronWeb.isAddress(address);
}

export { validateAddress };
