import { Curve, HashFunction, SignatureFormat, SignerSpec } from "../model/types_WIP";

import { ChainFamily } from "../model/types_WIP";

function getSignerSpecForFamily(family: ChainFamily): SignerSpec {
  switch (family) {
    case ChainFamily.EVM:
      return {
        curve: Curve.SECP256K1,
        hashFunction: HashFunction.KECCAK256,
        signatureFormat: SignatureFormat.RSV,
        coinType: "60",
      };

    case ChainFamily.COSMOS:
      return {
        curve: Curve.SECP256K1,
        hashFunction: HashFunction.SHA256,
        signatureFormat: SignatureFormat.RS,
        coinType: "118",
      };

    case ChainFamily.BITCOIN:
      return {
        curve: Curve.SECP256K1,
        hashFunction: HashFunction.SHA256,
        signatureFormat: SignatureFormat.RS,
        coinType: "0",
      };

    case ChainFamily.STARKNET:
      return {
        curve: Curve.STARK,
        hashFunction: HashFunction.PEDERSEN,
        signatureFormat: SignatureFormat.RS,
        coinType: "9004",
      };

    case ChainFamily.TON:
      return {
        curve: Curve.ED25519,
        hashFunction: HashFunction.SHA256,
        signatureFormat: SignatureFormat.RS,
        coinType: "607",
      };

    case ChainFamily.TRON:
      return {
        curve: Curve.SECP256K1,
        hashFunction: HashFunction.SHA256,
        signatureFormat: SignatureFormat.RSV,
        coinType: "195",
      };

    case ChainFamily.ALGORAND:
      return {
        curve: Curve.ED25519,
        hashFunction: HashFunction.SHA512_256,
        signatureFormat: SignatureFormat.RS,
        coinType: "283",
      };

    case ChainFamily.SOLANA:
      return {
        curve: Curve.ED25519,
        hashFunction: HashFunction.SHA256,
        signatureFormat: SignatureFormat.RS,
        coinType: "501",
      };

    case ChainFamily.APTOS:
      return {
        curve: Curve.ED25519,
        hashFunction: HashFunction.SHA256,
        signatureFormat: SignatureFormat.RS,
        coinType: "637",
      };

    case ChainFamily.STELLAR:
      // FIXME Check this is correct
      return {
        curve: Curve.ED25519,
        hashFunction: HashFunction.SHA256,
        signatureFormat: SignatureFormat.RS,
        coinType: "148",
      };

    default:
      throw new Error(`Unsupported chain family: ${family}`);
  }
}

// Special cases and overrides for specific chains
const SIGNER_SPEC_CHAIN_OVERRIDES: { [key: string]: Partial<SignerSpec> } = {
  // Special case for Injective which uses eth_secp256k1
  injective: {
    coinType: "60",
    hashFunction: HashFunction.KECCAK256,
    signatureFormat: SignatureFormat.RS,
  },

  // Special case for Evmos which uses eth_secp256k1
  evmos: {
    coinType: "60",
    hashFunction: HashFunction.SHA256,
    signatureFormat: SignatureFormat.RS,
  },

  // Special case for dYdX
  dydx: {
    coinType: "118",
    hashFunction: HashFunction.SHA256,
    signatureFormat: SignatureFormat.RS,
  },

  // Special case for Litecoin
  litecoin: {
    coinType: "2",
  },

  // Special case for Dogecoin
  dogecoin: {
    coinType: "3",
  },
};

// Function to get crypto specs for a specific chain
function getSignerSpecForChain(chainId: string, family: ChainFamily): SignerSpec {
  const baseSpecs = getSignerSpecForFamily(family);
  const overrides = SIGNER_SPEC_CHAIN_OVERRIDES[chainId];

  if (overrides) {
    return {
      ...baseSpecs,
      ...overrides,
    };
  }

  return baseSpecs;
}

export { getSignerSpecForChain };
