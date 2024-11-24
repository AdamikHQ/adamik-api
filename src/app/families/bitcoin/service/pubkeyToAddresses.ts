import { payments } from "bitcoinjs-lib";
import { TypedAddress } from "~/app/model/types_WIP";
import { getNetworkForChainId } from "../logic";
import { BitcoinService } from "../service";

async function pubkeyToAddresses(this: BitcoinService, pubkey: string): Promise<TypedAddress[]> {
  const addresses: TypedAddress[] = [];
  const network = getNetworkForChainId(this.chainId);

  const pubkeyBuffer = Buffer.from(pubkey, "hex");

  // Generate P2PKH address
  try {
    const { address: p2pkhAddress } = payments.p2pkh({ pubkey: pubkeyBuffer, network });
    if (p2pkhAddress) {
      addresses.push({
        type: "p2pkh",
        address: p2pkhAddress,
      });
    }
  } catch (error) {
    console.warn(`/!\\ Failed to convert public key '${pubkey}' to ${this.chainId} P2PKH address:`, error);
  }

  // Generate P2SH address
  try {
    const { address: p2shAddress } = payments.p2sh({
      redeem: payments.p2wpkh({ pubkey: pubkeyBuffer }),
    });
    if (p2shAddress) {
      addresses.push({
        type: "p2sh",
        address: p2shAddress,
      });
    }
  } catch (error) {
    console.warn(`/!\\ Failed to convert public key '${pubkey}' to ${this.chainId} P2SH address:`, error);
  }

  // Generate P2WPKH (bech32) address
  try {
    const { address: p2wpkhAddress } = payments.p2wpkh({
      pubkey: pubkeyBuffer,
      network,
    });
    if (p2wpkhAddress) {
      addresses.push({
        type: "p2wpkh",
        address: p2wpkhAddress,
      });
    }
  } catch (error) {
    console.warn(`/!\\ Failed to convert public key '${pubkey}' to ${this.chainId} P2WPKH address:`, error);
  }

  // Generate P2TR (taproot) address
  try {
    const { address: p2trAddress } = payments.p2tr({
      internalPubkey: pubkeyBuffer.subarray(1, 33),
      network,
    });
    if (p2trAddress) {
      addresses.push({
        type: "p2tr",
        address: p2trAddress,
      });
    }
  } catch (error) {
    console.warn(`/!\\ Failed to convert public key '${pubkey}' to ${this.chainId} P2TR address:`, error);
  }

  if (addresses.length === 0) {
    throw new Error(`Failed to convert public key '${pubkey}' to ${this.chainId} addresses`);
  }

  return addresses;
}

export { pubkeyToAddresses };
