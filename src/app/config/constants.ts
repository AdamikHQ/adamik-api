import { ChainId } from "../model/types_WIP";

const NODES: Map<ChainId, string> = new Map<ChainId, string>([
  [ChainId.ALGORAND, "https://algorand.coin.ledger.com/ps2/v2"],
  [ChainId.COSMOS, "https://cosmoshub4.coin.ledger.com"],
]);

const EXPLORERS: Map<ChainId, string> = new Map<ChainId, string>([
  [ChainId.ALGORAND, "https://algorand.coin.ledger.com/idx2/v2"],
]);

const MAX_RECURSION = 10;

export { NODES, EXPLORERS, MAX_RECURSION };
