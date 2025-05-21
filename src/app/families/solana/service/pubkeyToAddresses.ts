import { encodeBase58 } from "ethers";
import { TypedAddress } from "~/app/model/types_WIP";
import { SolanaService } from "../service";

/**
 * Converts a hex-encoded public key to an Solana address.
 * @param {string} pubkey - The public key in hex format (with or without '0x' prefix).
 * @returns {Promise<TypedAddress[]>} - The Solana address.
 */
async function pubkeyToAddresses(this: SolanaService, pubkey: string): Promise<TypedAddress[]> {
  // Remove '0x' prefix if present
  const cleanPubkey = pubkey.startsWith("0x") ? pubkey.slice(2) : pubkey;

  const address = encodeBase58(Buffer.from(cleanPubkey, "hex"));
  // Return the address in the expected format
  return [{ type: "default", address }];
}

export { pubkeyToAddresses };
