import { sha3_256 } from "@noble/hashes/sha3";
import { TypedAddress } from "~/app/model/types_WIP";

export async function pubkeyToAddresses(publicKey: string): Promise<TypedAddress[]> {
  const cleanHex = publicKey.startsWith("0x") ? publicKey.slice(2) : publicKey;
  const publicKeyBytes = Uint8Array.from(Buffer.from(cleanHex, "hex"));

  if (publicKeyBytes.length !== 32) {
    throw new Error("Invalid public key length for Ed25519");
  }

  const schemeByte = Uint8Array.from([0x00]);

  const toHash = new Uint8Array(publicKeyBytes.length + 1);
  toHash.set(publicKeyBytes, 0);
  toHash.set(schemeByte, 32);

  const hash = sha3_256(toHash);
  const address = "0x" + Buffer.from(hash).toString("hex");

  return [
    {
      type: "default",
      address,
    },
  ];
}
