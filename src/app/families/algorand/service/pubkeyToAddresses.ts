import { encodeAddress, isValidAddress } from "algosdk";
import { TypedAddress } from "~/app/model/types_WIP";
import { AlgorandService } from ".";

/**
 * Converts a public key to an Algorand address.
 * @param {string} pubkey - The public key in various formats.
 * @returns {Promise<TypedAddress[]>} - The Algorand address.
 */
async function pubkeyToAddresses(this: AlgorandService, pubkey: string): Promise<TypedAddress[]> {
  try {
    let pubkeyBuffer: Uint8Array;

    // Remove '0x' prefix if present
    const cleanPubkey = pubkey.startsWith("0x") ? pubkey.slice(2) : pubkey;

    // Check if the input is already a valid Algorand address (Base32)
    if (/^[A-Z2-7]{58}$/.test(cleanPubkey)) {
      if (isValidAddress(cleanPubkey)) {
        return [{ type: "default", address: cleanPubkey }];
      } else {
        throw new Error("Invalid Algorand address format.");
      }
    }

    // Check if the public key is hex encoded (64 characters for 32 bytes)
    if (/^[0-9A-Fa-f]{64}$/.test(cleanPubkey)) {
      pubkeyBuffer = new Uint8Array(Buffer.from(cleanPubkey, "hex"));
    }
    // Check if the public key is base64 encoded
    else if (/^[A-Za-z0-9+/=]{44}$/.test(cleanPubkey)) {
      pubkeyBuffer = Buffer.from(cleanPubkey, "base64");
    }
    // Check if it's a raw 32-byte public key
    else if (cleanPubkey.length === 32) {
      pubkeyBuffer = new Uint8Array(Buffer.from(cleanPubkey, "binary"));
    } else {
      throw new Error(
        "Unsupported public key format. Provide a valid Base32, Base64, or hex encoded public key."
      );
    }

    // Validate the length of the public key buffer
    if (pubkeyBuffer.length !== 32) {
      throw new Error(`Invalid public key length. Expected 32 bytes, got ${pubkeyBuffer.length} bytes.`);
    }

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
