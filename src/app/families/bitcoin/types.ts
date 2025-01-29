import { Psbt } from "bitcoinjs-lib";
import { z } from "zod";
import { UtxoWithMetadata } from "./backend/types";
import { isValidXpub } from "./logic";

// Params that differ for each bitcoin-like chain
type BitcoinChainParams = {
  // Number of blocks required for a transaction to be confirmed
  confirmations: number;
};

// Bitcoin-specific data, only used internally by the transaction crafting functions
// NOTE No better solution found than computing the full psbt early,
// in completeTransaction instead of encodeTransaction
type BitcoinTransactionParams = PsbtWithFee;

const bitcoinTransactionParamsSchema = z.object({
  inputs: UtxoWithMetadata,
  outputs: z.unknown(),
});

// Extract internal types from Psbt class, that are not exported by bitcoinjs...
type PsbtInputExtended = Parameters<typeof Psbt.prototype.addInput>[0];
type PsbtOutputExtended = Parameters<typeof Psbt.prototype.addOutput>[0];

type PsbtWithFee = {
  psbt: Psbt;
  fee: number;
};

/**
 * Branding allows us to prevent asigning any non-parsed value to a branded one.
 * @see {@link https://egghead.io/blog/using-branded-types-in-typescript} or {@link https://prosopo.io/articles/typescript-branding/}
 * */
// TODO: move to shared lib?
declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
type Branded<T, B> = T & Brand<B>;

/**  Defines Xpub as a branded string, {@link isValidXpub} has to be used to check if a string is an Xpub */
type Xpub = Branded<string, "Xpub">;

export { bitcoinTransactionParamsSchema };
export type {
  BitcoinChainParams,
  BitcoinTransactionParams,
  Branded,
  PsbtInputExtended,
  PsbtOutputExtended,
  PsbtWithFee,
  Xpub,
};
