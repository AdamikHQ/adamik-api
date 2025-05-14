import { sha256 as nobleSHA256 } from "@noble/hashes/sha256";
import { keccak_256 as nobleKeccak256 } from "@noble/hashes/sha3";
import { sha512_256 as nobleSHA512_256 } from "@noble/hashes/sha512";

const keccak256 = (messageBytes: Buffer): string => {
  return Buffer.from(nobleKeccak256(messageBytes)).toString("hex");
};

const sha256 = (messageBytes: Buffer): string => {
  return Buffer.from(nobleSHA256(messageBytes)).toString("hex");
};

const sha512_256 = (messageBytes: Buffer): string => {
  return Buffer.from(nobleSHA512_256(messageBytes)).toString("hex");
};

export { keccak256, sha256, sha512_256 };
