import { BtcService } from ".";
import { isValidAddress, isXpub } from "../logic";

async function validateAddress(this: BtcService, address: string): Promise<boolean> {
    return isXpub(address) || isValidAddress(address, this.chainId);
}

export { validateAddress };
