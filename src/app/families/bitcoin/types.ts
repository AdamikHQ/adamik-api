import { z } from "zod";
import { UtxoWithMetadata } from "./backend/types";

// Params that differ for each bitcoin-like chain
type BtcChainParams = {
  confirmations: number;
};

// Bitcoin-specific fields used internaly by the chains transactions
type BtcTransactionParams = {
  // Public key of the sender address, necessary when it never made a transaction yet
  inputs: UtxoWithMetadata[];
};

// TODO: move to shared lib?
declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
type Branded<T, B> = T & Brand<B>;

/**
 * Defines Xpub as a branded string to prevent casting any invalid string to Xpub, `isXpub` has to be used
 */
type Xpub = Branded<string, "Xpub">;

export type { BtcChainParams, BtcTransactionParams, Xpub, Branded };
