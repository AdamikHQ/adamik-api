import { pubkeyToAddress as aminoPubkeyToAddress, encodeSecp256k1Pubkey } from "@cosmjs/amino";
import { fromBase64 } from "@cosmjs/encoding";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams } from "~/app/families/cosmos/types";
import { ChainId, ChainParams, TypedAddress } from "~/app/model/types_WIP";
import { CosmosService } from ".";

// Type guard to check if the chain params include Cosmos-related fields
function isCosmosChain(params: ChainParams): params is CosmosChainParams {
  return !!params && (params as CosmosChainParams).prefix !== undefined;
}

async function pubkeyToAddresses(this: CosmosService, pubkey: string): Promise<TypedAddress[]> {
  // Now this is properly typed as CosmosService
  try {
    const chainId = this.chainId as ChainId;

    // Get the chain parameters based on chainId
    const chain = CHAINS[chainId];
    if (!chain || !chain.params) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }

    // Type guard to ensure we are dealing with a Cosmos-based chain
    if (!isCosmosChain(chain.params)) {
      throw new Error(`Chain ${chainId} does not support Cosmos-style addresses.`);
    }

    const prefix = chain.params.prefix; // Get the Bech32 prefix for the Cosmos-based chain

    // Convert Base64 pubkey to Buffer
    const pubKeyBuffer = fromBase64(pubkey);

    // Create an Amino public key object
    const aminoPubKey = encodeSecp256k1Pubkey(pubKeyBuffer);

    // Use the pubkeyToAddress function to get the address with the correct prefix
    const address = aminoPubkeyToAddress(aminoPubKey, prefix);

    // Return the address in the expected format
    return [{ address, type: "default" }];
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in pubkeyToAddresses: ${error.message}`);
    } else {
      console.error("An unknown error occurred in pubkeyToAddresses.");
    }
    throw new Error("Failed to convert public key to addresses.");
  }
}

export { pubkeyToAddresses };
