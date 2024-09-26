import { encodeAddress, isValidAddress } from "algosdk";
import { TypedAddress } from "~/app/model/types_WIP";
import { AlgorandService } from ".";

/**
 * Converts a public key to an Algorand address.
 * @param {string} pubkey - The public key in hex or base64 format.
 * @returns {Promise<TypedAddress[]>} - The Algorand address.
 */
async function pubkeyToAddresses(this: AlgorandService, pubkey: string): Promise<TypedAddress[]> {
  try {
    let pubkeyBuffer: Uint8Array;

    // Check if the public key is hex encoded
    if (/^[0-9A-Fa-f]{64}$/.test(pubkey)) {
      pubkeyBuffer = new Uint8Array(Buffer.from(pubkey, "hex"));
    }
    // Check if the public key is base64 encoded
    else if (/^[A-Za-z0-9+/=]+$/.test(pubkey) && pubkey.length % 4 === 0) {
      pubkeyBuffer = Buffer.from(pubkey.trim(), "base64");
    } else {
      throw new Error("Unsupported public key format. Provide a valid Base64 or hex encoded public key.");
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
