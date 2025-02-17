import { SignerSpec } from "../model/types_WIP";

import { ChainFamily } from "../model/types_WIP";

function getSignerSpecsForChains(family: ChainFamily): SignerSpec {
  switch (family) {
    case ChainFamily.EVM:
      return {
        curve: "secp256k1",
        hashFunction: "keccak256",
        signatureFormat: ["r", "s", "v"],
        derivationPath: "m/44'/60'/0'/0/0",
        addressFormat: "keccak256(publicKey)[12:32]",
      };

    case ChainFamily.COSMOS:
      return {
        curve: "secp256k1",
        hashFunction: "sha256",
        signatureFormat: ["r", "s"],
        derivationPath: "m/44'/118'/0'/0/0",
        addressFormat: "ripemd160(sha256(publicKey))",
      };

    case ChainFamily.BITCOIN:
      return {
        curve: "secp256k1",
        hashFunction: "double-sha256",
        signatureFormat: ["r", "s"],
        derivationPath: "m/44'/0'/0'/0/0",
        addressFormat: "base58check(ripemd160(sha256(publicKey)))",
      };

    case ChainFamily.STARKNET:
      return {
        curve: "stark",
        hashFunction: "pedersen",
        signatureFormat: ["r", "s"],
        derivationPath: "m/44'/9004'/0'/0/0",
        addressFormat: "starkCurveCompute",
      };

    case ChainFamily.TON:
      return {
        curve: "ed25519",
        hashFunction: "sha256",
        signatureFormat: ["r", "s"],
        derivationPath: "m/44'/607'/0'/0'/0'",
        addressFormat: "sha256(publicKey)",
      };

    case ChainFamily.TRON:
      return {
        curve: "secp256k1",
        hashFunction: "keccak256",
        signatureFormat: ["r", "s", "v"],
        derivationPath: "m/44'/195'/0'/0/0",
        addressFormat: "base58check(keccak256(publicKey)[12:32])",
      };

    case ChainFamily.ALGORAND:
      return {
        curve: "ed25519",
        hashFunction: "sha512_256",
        signatureFormat: ["r", "s"],
        derivationPath: "m/44'/283'/0'/0/0",
        addressFormat: "base32(sha512_256(publicKey))",
      };

    default:
      throw new Error(`Unsupported chain family: ${family}`);
  }
}

// Special cases and overrides for specific chains
const CHAIN_CRYPTO_OVERRIDES: { [key: string]: Partial<SignerSpec> } = {
  // Special case for Injective which uses eth_secp256k1
  injective: {
    derivationPath: "m/44'/60'/0'/0/0",
    hashFunction: "sha256",
    signatureFormat: ["r", "s"],
  },

  // Special case for Evmos which uses eth_secp256k1
  evmos: {
    derivationPath: "m/44'/60'/0'/0/0",
    hashFunction: "sha256",
    signatureFormat: ["r", "s"],
  },

  // Special case for dYdX
  dydx: {
    derivationPath: "m/44'/118'/0'/0/0",
    hashFunction: "sha256",
    signatureFormat: ["r", "s"],
  },

  // Special case for Litecoin
  litecoin: {
    derivationPath: "m/44'/2'/0'/0/0",
  },

  // Special case for Dogecoin
  dogecoin: {
    derivationPath: "m/44'/3'/0'/0/0",
  },
};

// Function to get crypto specs for a specific chain
function getSignerSpecs(chainId: string, family: ChainFamily): SignerSpec {
  const baseSpecs = getSignerSpecsForChains(family);
  const overrides = CHAIN_CRYPTO_OVERRIDES[chainId];

  if (overrides) {
    return {
      ...baseSpecs,
      ...overrides,
    };
  }

  return baseSpecs;
}

export { getSignerSpecs };
