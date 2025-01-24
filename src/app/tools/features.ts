import { Chain, ChainFeatures, ChainSupportedFeatures } from "~/app/model/types_WIP";
import { providers } from "tronweb";

export function parseFeatures(nested: ChainSupportedFeatures): ChainFeatures[] {
  const features: ChainFeatures[] = [];

  if (nested.read.token) features.push(ChainFeatures.READ__TOKENS);
  if (nested.read.validators) features.push(ChainFeatures.READ__VALIDATORS);
  if (nested.read.account.balances.native) features.push(ChainFeatures.READ__ACCOUNT__BALANCES__NATIVE);
  if (nested.read.account.balances.tokens) features.push(ChainFeatures.READ__ACCOUNT__BALANCES__TOKENS);
  if (nested.read.account.balances.staking) features.push(ChainFeatures.READ__ACCOUNT__BALANCES__STAKING);
  if (nested.read.account.transactions.native)
    features.push(ChainFeatures.READ__ACCOUNT__TRANSACTIONS__NATIVE);
  if (nested.read.account.transactions.tokens)
    features.push(ChainFeatures.READ__ACCOUNT__TRANSACTIONS__TOKENS);
  if (nested.read.account.transactions.staking)
    features.push(ChainFeatures.READ__ACCOUNT__TRANSACTIONS__STAKING);
  if (nested.read.transaction.native) features.push(ChainFeatures.READ__TRANSACTION__NATIVE);
  if (nested.read.transaction.tokens) features.push(ChainFeatures.READ__TRANSACTION__TOKENS);
  if (nested.read.transaction.staking) features.push(ChainFeatures.READ__TRANSACTION__STAKING);
  if (nested.write.transaction.type.native) features.push(ChainFeatures.WRITE__TRANSACTION__TYPE__NATIVE);
  if (nested.write.transaction.type.tokens) features.push(ChainFeatures.WRITE__TRANSACTION__TYPE__TOKENS);
  if (nested.write.transaction.type.staking) features.push(ChainFeatures.WRITE__TRANSACTION__TYPE__STAKING);
  if (nested.write.transaction.field.memo) features.push(ChainFeatures.WRITE__TRANSACTION__FIELD__MEMO);

  return features;
}

export function formatFeatures(flat: ChainFeatures[]): ChainSupportedFeatures {
  return {
    read: {
      token: flat.includes(ChainFeatures.READ__TOKENS),
      validators: flat.includes(ChainFeatures.READ__VALIDATORS),
      account: {
        balances: {
          native: flat.includes(ChainFeatures.READ__ACCOUNT__BALANCES__NATIVE),
          tokens: flat.includes(ChainFeatures.READ__ACCOUNT__BALANCES__TOKENS),
          staking: flat.includes(ChainFeatures.READ__ACCOUNT__BALANCES__STAKING),
        },
        transactions: {
          native: flat.includes(ChainFeatures.READ__ACCOUNT__TRANSACTIONS__NATIVE),
          tokens: flat.includes(ChainFeatures.READ__ACCOUNT__TRANSACTIONS__TOKENS),
          staking: flat.includes(ChainFeatures.READ__ACCOUNT__TRANSACTIONS__STAKING),
        },
      },
      transaction: {
        native: flat.includes(ChainFeatures.READ__TRANSACTION__NATIVE),
        tokens: flat.includes(ChainFeatures.READ__TRANSACTION__TOKENS),
        staking: flat.includes(ChainFeatures.READ__TRANSACTION__STAKING),
      },
    },
    write: {
      transaction: {
        type: {
          native: flat.includes(ChainFeatures.WRITE__TRANSACTION__TYPE__NATIVE),
          tokens: flat.includes(ChainFeatures.WRITE__TRANSACTION__TYPE__TOKENS),
          staking: flat.includes(ChainFeatures.WRITE__TRANSACTION__TYPE__STAKING),
        },
        field: {
          memo: flat.includes(ChainFeatures.WRITE__TRANSACTION__FIELD__MEMO),
        },
      },
    },
  };
}

export function featuresUnion(features: ChainFeatures[][]): ChainFeatures[] {
  return Array.from(features.reduce((a, c) => a.union(new Set(c)), new Set<ChainFeatures>(features[0])));
}

export function featuresIntersect(features: ChainFeatures[][]): ChainFeatures[] {
  return Array.from(
    features.reduce((a, c) => a.intersection(new Set(c)), new Set<ChainFeatures>(features[0]))
  );
}

export function setsEqual(a: Set<any>, b: Set<any>): boolean {
  return a.size === b.size && new Set([...a, ...b]).size === a.size;
}

export function chainSupports(chain: Chain, features: ChainFeatures[]): boolean {
  if (chain.providers === undefined) {
    const supported = parseFeatures(chain.supportedFeatures);
    return features.every((feature) => supported.includes(feature));
  }
  return chain.providers.some((providers) =>
    features.every((feature) => providers.features.includes(feature))
  );
}
