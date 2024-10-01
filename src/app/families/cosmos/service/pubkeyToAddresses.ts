import { pubkeyToAddress as aminoPubkeyToAddress, encodeSecp256k1Pubkey } from "@cosmjs/amino";
import { Secp256k1 } from "@cosmjs/crypto";
import { fromHex } from "@cosmjs/encoding";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams } from "~/app/families/cosmos/types";
import { ChainId, ChainParams, TypedAddress } from "~/app/model/types_WIP";
import { CosmosService } from ".";

// Type guard to check if the chain params include Cosmos-related fields
function isCosmosChain(params: ChainParams): params is CosmosChainParams {
  return !!params && (params as CosmosChainParams).prefix !== undefined;
}

async function pubkeyToAddresses(this: CosmosService, pubkey: string): Promise<TypedAddress[]> {
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

  const pubKeyBuffer: Uint8Array =
    /^(02|03)[0-9A-Fa-f]{64}$/.test(pubkey) || /^04[0-9A-Fa-f]{128}$/.test(pubkey)
      ? fromHex(pubkey)
      : (() => {
          throw new Error(
            "Unsupported public key format. Please provide a valid hex encoded public key (compressed or uncompressed)."
          );
        })();

  // Compress the public key if it's uncompressed (65 bytes)
  const compressedPubKey = pubKeyBuffer.length === 65 ? Secp256k1.compressPubkey(pubKeyBuffer) : pubKeyBuffer;

  // Ensure the public key is valid and compressed
  if (compressedPubKey.length !== 33) {
    throw new Error("Invalid public key: must be 33 bytes when compressed");
  }

  const aminoPubKey = encodeSecp256k1Pubkey(compressedPubKey);
  const address = aminoPubkeyToAddress(aminoPubKey, prefix);

  // Return the address in the expected format
  return [{ address, type: "default" }];
}

export { pubkeyToAddresses };
