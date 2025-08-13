import { StrKey } from "@stellar/stellar-sdk";
import { TypedAddress } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { StellarService } from "../service";

/**
 * Converts a hex-encoded public key to a Stellar address using the official Stellar SDK.
 * In Stellar, public keys and addresses use the same G-prefixed StrKey format.
 * @param pubkey - The public key in hex format (with or without '0x' prefix)
 * @returns Promise<TypedAddress[]> - Array containing the Stellar address
 */
async function pubkeyToAddresses(this: StellarService, pubkey: string): Promise<TypedAddress[]> {
  // Remove '0x' prefix if present
  const cleanPubkey = pubkey.startsWith("0x") ? pubkey.slice(2) : pubkey;

  // Validate the public key format
  if (!/^[0-9a-fA-F]{64}$/.test(cleanPubkey)) {
    throw new UserInputError("Invalid public key format. Expected a 64-character hex string.");
  }

  // Convert hex string to buffer
  const pubkeyBuffer = Buffer.from(cleanPubkey, "hex");

  if (pubkeyBuffer.length !== 32) {
    throw new UserInputError("Invalid public key length. Expected 32 bytes for Ed25519 public key.");
  }

  try {
    // Use Stellar SDK to encode the public key as a StrKey address
    const address = StrKey.encodeEd25519PublicKey(pubkeyBuffer);

    return [
      {
        type: "default",
        address,
      },
    ];
  } catch (error) {
    console.warn(`/!\\ Failed to encode Stellar address for pubkey ${pubkey}:`, error);
    throw new UserInputError("Failed to encode Stellar address");
  }
}

export { pubkeyToAddresses };
