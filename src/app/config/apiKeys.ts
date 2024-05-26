import { ChainId } from "../model/types_WIP";

// FIXME Manage this through Vercel env vars?...
const EXPLORER_API_KEYS: Map<ChainId, string> = new Map([
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

export { EXPLORER_API_KEYS };
