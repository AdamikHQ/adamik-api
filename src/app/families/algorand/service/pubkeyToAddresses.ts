import { encodeAddress, isValidAddress } from "algosdk";
import { TypedAddress } from "~/app/model/types_WIP";
import { AlgorandService } from ".";

/**
 * Converts a hex-encoded public key to an Algorand address.
 * @param {string} pubkey - The public key in hex format (with or without '0x' prefix).
 * @returns {Promise<TypedAddress[]>} - The Algorand address.
 */
async function pubkeyToAddresses(this: AlgorandService, pubkey: string): Promise<TypedAddress[]> {
  try {
    // Remove '0x' prefix if present
    const cleanPubkey = pubkey.startsWith("0x") ? pubkey.slice(2) : pubkey;

    // Check if the public key is hex encoded (64 characters for 32 bytes)
    if (!/^[0-9A-Fa-f]{64}$/.test(cleanPubkey)) {
      throw new Error(
        "Invalid input format. Please provide a 32-byte public key in hex format (64 hexadecimal characters, with or without '0x' prefix)."
      );
    }

    const pubkeyBuffer = new Uint8Array(Buffer.from(cleanPubkey, "hex"));

    // Encode the public key buffer to an Algorand address
    const address = encodeAddress(pubkeyBuffer);

    // Validate the generated address
    if (!isValidAddress(address)) {
      throw new Error("Generated address is not valid");
    }

    // Return the address in the expected format
    return [{ type: "default", address }];
  } catch (error) {
    throw new Error(
      `Failed to convert public key to address: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export { pubkeyToAddresses };
