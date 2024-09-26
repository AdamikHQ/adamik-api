import { isAddress } from "viem";
import { CHAINS } from "~/app/config/chains";
import { EvmChainParams } from "~/app/families/evm/types";
import { ChainId, ChainParams } from "~/app/model/types_WIP";
import { EvmService } from ".";

// Type guard to check if the chain params include EVM-related fields
function isEvmChain(params: ChainParams): params is EvmChainParams {
  return !!params && "isL2Fees" in params;
}

/**
 * Validates an EVM address.
 * @param {string} address - The address to validate.
 * @returns {Promise<boolean>} - Returns true if the address is valid, false otherwise.
 */
async function validateAddress(this: EvmService, address: string): Promise<boolean> {
  try {
    const chainId = this.chainId as ChainId;
    console.log(`Validating address for chainId: ${chainId}`);

    // Get the chain parameters based on chainId
    const chain = CHAINS[chainId];
    if (!chain) {
      console.warn(`Chain not found in CHAINS object for chainId: ${chainId}`);
      // Proceed with validation even if chain is not found
    } else if (!chain.params) {
      console.warn(`No params found for chainId: ${chainId}`);
      // Proceed with validation even if params are not found
    } else if (!isEvmChain(chain.params)) {
      console.warn(`Chain ${chainId} does not have EVM-style params.`);
      // Proceed with validation even if it's not recognized as an EVM chain
    }

    // Validate the address using viem's isAddress function
    const isValid = isAddress(address);
    console.log(`Address validation result for ${chainId}: ${isValid}`);

    return isValid;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in validateAddress for ${this.chainId}: ${error.message}`);
    } else {
      console.error(`An unknown error occurred in validateAddress for ${this.chainId}.`);
    }
    return false;
  }
}

export { validateAddress };
