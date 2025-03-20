import { SHA512_256 } from "@noble/hashes/sha512";
import { ethers } from "ethers";
import { ec } from "starknet";

const keccak256 = (messageBytes: Buffer): string => {
  return Buffer.from(ethers.keccak256(messageBytes).slice(2), "hex").toString("hex");
};

const sha256 = (messageBytes: Buffer): string => {
  return Buffer.from(ethers.sha256(messageBytes).slice(2), "hex").toString("hex");
};

const pedersen = (messageBytes: Buffer): string => {
  const x = messageBytes;
  const y = Buffer.from("00", "hex");
  const pedersenHash = ec.starkCurve.pedersen(x, y);
  return Buffer.from(pedersenHash.slice(2), "hex").toString("hex");
};

const sha512_256 = (messageBytes: Buffer): string => {
  const hash = new SHA512_256();
  hash.update(messageBytes);
  return Buffer.from(hash.digest().slice(2)).toString("hex");
};

export { keccak256, pedersen, sha256, sha512_256 };
