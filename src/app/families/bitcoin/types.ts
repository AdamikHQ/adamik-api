// Params that differ for each bitcoin-like chain
type BtcParams = {
    confirmations: number;
};

// TODO: move to shared lib?
declare const __brand: unique symbol
type Brand<B> = { [__brand]: B }
export type Branded<T, B> = T & Brand<B>

/**
 * Defines Xpub as a branded string to prevent casting any invalid string to Xpub, `isXpub` has to be used
 */
export type Xpub = Branded<string, "Xpub">;

export type { BtcParams };
