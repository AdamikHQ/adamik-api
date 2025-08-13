import { StrKey } from "@stellar/stellar-sdk";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";

/**
 * Validates a Stellar address using the official Stellar SDK.
 * Stellar addresses are Ed25519 public keys encoded in base32 with a CRC16 checksum.
 * Valid addresses start with 'G' for regular accounts.
 *
 * @param address - The address string to validate
 * @returns boolean - true if the address is valid, false otherwise
 */
function isValidAddress(address: string): boolean {
  try {
    // Use Stellar SDK's built-in validation for Ed25519 public keys
    return StrKey.isValidEd25519PublicKey(address);
  } catch (error) {
    return false;
  }
}

function convertToStroops(xlmBalance: string): bigint {
  const chain = CHAINS[ChainId.STELLAR];
  return BigInt(Math.floor(parseFloat(xlmBalance) * Math.pow(10, chain.decimals)));
}

export { convertToStroops, isValidAddress };
