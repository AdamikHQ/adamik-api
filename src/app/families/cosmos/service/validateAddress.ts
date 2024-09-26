import { bech32 } from "bech32";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams } from "~/app/families/cosmos/types";
import { ChainId, ChainParams } from "~/app/model/types_WIP";
import { CosmosService } from ".";

// Type guard to check if the chain parameters are for a Cosmos-based chain
function isCosmosChain(params: ChainParams): params is CosmosChainParams {
  return !!params && "prefix" in params;
}

/**
 * Validates a Cosmos-based address.
 * @param {string} address - The address to validate.
 * @returns {Promise<boolean>} - Returns true if the address is valid, false otherwise.
 */
async function validateAddress(this: CosmosService, address: string): Promise<boolean> {
  try {
    // Get the chain ID and corresponding chain information
    const chainId = this.chainId as ChainId;
    const chain = CHAINS[chainId];

    // Check if the chain is supported and has parameters
    if (!chain?.params) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }

    // Ensure the chain supports Cosmos-style addresses
    if (!isCosmosChain(chain.params)) {
      throw new Error(`Chain ${chainId} does not support Cosmos-style addresses.`);
    }

    // Get the expected address prefix for this chain
    const expectedPrefix = chain.params.prefix;

    // Decode the Bech32 address
    const decoded = bech32.decode(address);

    // Check if the address prefix matches the expected prefix for this chain
    if (decoded.prefix !== expectedPrefix) {
      return false;
    }

    // Verify the length of the decoded address (should be 20 bytes for Cosmos addresses)
    const decodedLength = bech32.fromWords(decoded.words).length;
    return decodedLength === 20;
  } catch (error) {
    // Log any errors that occur during validation
    console.error("Error in validateAddress:", error);
    return false;
  }
}

export { validateAddress };
