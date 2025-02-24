import bs58 from "bs58";
import { keccak256 } from "viem";
import { TypedAddress } from "~/app/model/types_WIP";
import { TronService } from "../service";

async function pubkeyToAddresses(this: TronService, pubkey: string): Promise<TypedAddress[]> {
  // Remove the first byte if it's a 04 prefix (indicating an uncompressed key)
  const pubKeyBytes = Buffer.from(pubkey.startsWith("04") ? pubkey.slice(2) : pubkey, "hex");

  // Hash the public key using keccak256
  const hash = keccak256(pubKeyBytes);

  // Take the last 20 bytes of the hash
  const addressBytes = Buffer.from(hash.slice(-40), "hex");

  // Prepend the Tron address prefix (0x41)
  const tronAddressBytes = Buffer.concat([Buffer.from([0x41]), addressBytes]);

  // Perform Base58Check encoding
  const tronAddressBase58 = bs58.encode(tronAddressBytes);

  return [
    {
      type: "default",
      address: tronAddressBase58,
    },
  ];
}

export { pubkeyToAddresses };
