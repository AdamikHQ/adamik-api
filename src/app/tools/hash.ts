import { sha256 as nobleSHA256 } from "@noble/hashes/sha256";
import { keccak_256 as nobleKeccak256 } from "@noble/hashes/sha3";
import { sha512_256 as nobleSHA512_256 } from "@noble/hashes/sha512";
import { HashFunction } from "../model/types_WIP";

function keccak256(messageBytes: Buffer): string {
  return Buffer.from(nobleKeccak256(messageBytes)).toString("hex");
}

function sha256(messageBytes: Buffer): string {
  return Buffer.from(nobleSHA256(messageBytes)).toString("hex");
}

function sha512_256(messageBytes: Buffer): string {
  return Buffer.from(nobleSHA512_256(messageBytes)).toString("hex");
}

function getHashedTransaction(hashFunction: HashFunction, encodedTransaction: string): string {
  const transactionBuffer = Buffer.from(encodedTransaction, "hex");

  switch (hashFunction) {
    case HashFunction.SHA256:
      return sha256(transactionBuffer);
    case HashFunction.SHA512_256:
      return sha512_256(transactionBuffer);
    case HashFunction.KECCAK256:
      return keccak256(transactionBuffer);
    default:
      throw new Error(`Unsupported hash function: ${hashFunction}`);
  }
}

export { getHashedTransaction, keccak256, sha256, sha512_256 };
