import { BtcService } from ".";
import { isValidAddress } from "../logic";

async function validateAddress(this: BtcService, address: string): Promise<boolean> {
    return isValidAddress(address, this.chainId);
}

export { validateAddress };
