import { ChainId } from "~/app/model/types_WIP";
import { BaseChainService } from "~/app/model/service";
import { AlgorandService } from "./algorand/service";
import { CosmosService } from "./cosmos/service";
import { EvmService } from "./evm/service";
import { BtcService } from "./bitcoin/service";

// Mapping of service to use for each supported chain ID
const SERVICES = new Map<ChainId, BaseChainService>([
  // Algorand
  [ChainId.ALGORAND, new AlgorandService(ChainId.ALGORAND)],

  // Cosmos
  [ChainId.COSMOSHUB, new CosmosService(ChainId.COSMOSHUB)],
  [ChainId.COSMOSHUB_TESTNET, new CosmosService(ChainId.COSMOSHUB_TESTNET)],
  [ChainId.OSMOSIS, new CosmosService(ChainId.OSMOSIS)],

  // EVM
  [ChainId.ETHEREUM, new EvmService(ChainId.ETHEREUM)],
  [ChainId.SEPOLIA, new EvmService(ChainId.SEPOLIA)],
  [ChainId.HOLESKY, new EvmService(ChainId.HOLESKY)],
  [ChainId.ZKSYNC, new EvmService(ChainId.ZKSYNC)],
  [ChainId.ZKSYNC_SEPOLIA, new EvmService(ChainId.ZKSYNC_SEPOLIA)],
  [ChainId.INJECTIVE_TESTNET, new EvmService(ChainId.INJECTIVE_TESTNET)],
  [ChainId.BASE, new EvmService(ChainId.BASE)],
  [ChainId.BASE_SEPOLIA, new EvmService(ChainId.BASE_SEPOLIA)],
  [ChainId.OPTIMISM, new EvmService(ChainId.OPTIMISM)],
  [ChainId.OPTIMISM_SEPOLIA, new EvmService(ChainId.OPTIMISM_SEPOLIA)],
  [ChainId.ARBITRUM, new EvmService(ChainId.ARBITRUM)],
  [ChainId.ARBITRUM_SEPOLIA, new EvmService(ChainId.ARBITRUM_SEPOLIA)],

  // BTC
  [ChainId.BITCOIN, new BtcService(ChainId.BITCOIN)],
  [ChainId.BITCOIN_TESTNET, new BtcService(ChainId.BITCOIN_TESTNET)],
]);

export { SERVICES };
