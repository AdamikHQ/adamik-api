import { ChainId } from "../model/types_WIP";

// FIXME Manage this through Vercel storage or env vars?...

const ETHERSCAN_API_KEYS: Map<ChainId, string> = new Map([
  [ChainId.ETHEREUM, "REDACTED"],
  [ChainId.SEPOLIA, "REDACTED"],
  [ChainId.HOLESKY, "REDACTED"],

  [ChainId.BASE, "REDACTED"],
  [ChainId.BASE_SEPOLIA, "REDACTED"],

  [ChainId.OPTIMISM, "REDACTED"],
  [ChainId.OPTIMISM_SEPOLIA, "REDACTED"],

  [ChainId.ARBITRUM, "REDACTED"],
  [ChainId.ARBITRUM_SEPOLIA, "REDACTED"],

  [ChainId.ZKSYNC, "REDACTED"],
  [ChainId.ZKSYNC_SEPOLIA, "REDACTED"],
]);

const MORALIS_API_KEY =
  "REDACTED";

const BLOCKCHAIR_API_KEY = "A___5bKkPLWeqKiAWd9sWaqL09M9rFlU"

export { ETHERSCAN_API_KEYS, MORALIS_API_KEY, BLOCKCHAIR_API_KEY };
