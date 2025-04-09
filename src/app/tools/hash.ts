import { sha256 as nobleSHA256 } from "@noble/hashes/sha256";
import { keccak_256 as nobleKeccak256 } from "@noble/hashes/sha3";
import { SHA512_256 } from "@noble/hashes/sha512";

const keccak256 = (messageBytes: Buffer): string => {
  return Buffer.from(nobleKeccak256(messageBytes.toString()).slice(2)).toString("hex");
};

const sha256 = (messageBytes: Buffer): string => {
  return Buffer.from(nobleSHA256(messageBytes.toString()).slice(2)).toString("hex");
};

const sha512_256 = (messageBytes: Buffer): string => {
  const hash = new SHA512_256();
  hash.update(messageBytes);
  return Buffer.from(hash.digest().slice(2)).toString("hex");
};

export { keccak256, sha256, sha512_256 };
