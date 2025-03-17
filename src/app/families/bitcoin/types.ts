import { Psbt } from "bitcoinjs-lib";
import { z } from "zod";
import { isValidXpub } from "./logic";

// Params that differ for each bitcoin-like chain
type BitcoinChainParams = {
  // Number of blocks required for a transaction to be confirmed
  confirmations: number;
};

// NOTE No better solution found than computing the full
// PSBTs early, in completeTransaction instead of encodeTransaction
// (all PSBTs must be in hex format)
type BitcoinTransactionParams = {
  transferPsbt?: string;
  stakingPsbt?: string;
  unbondingPsbt?: string;
  slashingPsbt?: string;
  unbondingSlashingPsbt?: string;
};

const utxoWithMetadataSchema = z
  .object({
    block_id: z.number(),
    transaction_hash: z.string(),
    index: z.number(),
    value: z.number(),
    address: z.string(),
    script_hex: z.string().optional(),
  })
  .transform((data) => {
    return {
      /** Add fields for compatibility with coinselect @see {@link UTXO} */
      // NOTE The published 'UTXO' type from coinselect is WRONG!
      // The runtime data actually matches this UtxoWithMetadata type
      txid: data.transaction_hash,
      vout: data.index,
      ...data,
    };
  });

type UtxoWithMetadata = z.infer<typeof utxoWithMetadataSchema>;

const bitcoinTransactionParamsSchema = z.object({
  inputs: utxoWithMetadataSchema,
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

export { bitcoinTransactionParamsSchema, utxoWithMetadataSchema };
export type {
  BitcoinChainParams,
  BitcoinTransactionParams,
  Branded,
  PsbtInputExtended,
  PsbtOutputExtended,
  PsbtWithFee,
  UtxoWithMetadata,
  Xpub,
};
