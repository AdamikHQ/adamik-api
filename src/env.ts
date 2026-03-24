import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    MOESIF_APPLICATION_ID: z.string().min(1).optional(),
    TEST_ENV: z.string().optional(),
    REDIS_URL: z.string().min(1),

    ETHERSCAN_API_KEY_ETHEREUM: z.string().min(1).optional(),
    ETHERSCAN_API_KEY_BASE: z.string().min(1).optional(),
    ETHERSCAN_API_KEY_OPTIMISM: z.string().min(1).optional(),
    ETHERSCAN_API_KEY_ARBITRUM: z.string().min(1).optional(),
    ETHERSCAN_API_KEY_ZKSYNC: z.string().min(1).optional(),
    MORALIS_API_KEY: z.string().min(1).optional(),
    MINTSCAN_API_KEY: z.string().min(1).optional(),
    BLOCKCHAIR_API_KEY: z.string().min(1).optional(),
    TON_API_KEY: z.string().min(1).optional(),
    OKLINK_API_KEY: z.string().min(1).optional(),
    TON_CENTER_API_KEY: z.string().min(1).optional(),
    TRONGRID_API_KEY: z.string().min(1).optional(),
    TRONSCAN_API_KEY: z.string().min(1).optional(),
    STARKSCAN_API_KEY: z.string().min(1).optional(),
    ALCHEMY_API_KEY: z.string().min(1).optional(),
    HELIUS_API_KEY: z.string().min(1).optional(),
    SOLANA_VALIDATORS_APP_API_KEY: z.string().min(1).optional(),

    // Moralis node tokens (per-chain)
    MORALIS_NODE_TOKEN_ETH: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_SEPOLIA: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_HOLESKY: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_ZKSYNC: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_ZKSYNC_SEPOLIA: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_BASE: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_BASE_SEPOLIA: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_OPTIMISM: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_OPTIMISM_SEPOLIA: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_ARBITRUM: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_ARBITRUM_SEPOLIA: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_POLYGON: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_AMOY: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_BSC: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_BSC_TESTNET: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_LINEA: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_LINEA_SEPOLIA: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_AVALANCHE: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_GNOSIS: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_GNOSIS_TESTNET: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_MOONBEAM: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_MOONRIVER: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_MOONBASE: z.string().min(1).optional(),
    MORALIS_NODE_TOKEN_MANTLE: z.string().min(1).optional(),

    // QuickNode tokens
    QUICKNODE_TOKEN_COSMOS: z.string().min(1).optional(),
    QUICKNODE_TOKEN_CELESTIA: z.string().min(1).optional(),
    QUICKNODE_TOKEN_POLYGON: z.string().min(1).optional(),
    QUICKNODE_TOKEN_INJECTIVE: z.string().min(1).optional(),
    QUICKNODE_TOKEN_HYPERLIQUID: z.string().min(1).optional(),
    QUICKNODE_TOKEN_STELLAR: z.string().min(1).optional(),
    QUICKNODE_TOKEN_STELLAR_TESTNET: z.string().min(1).optional(),

    // Lava gateway token
    LAVA_GATEWAY_TOKEN: z.string().min(1).optional(),
  },

  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    MOESIF_APPLICATION_ID: process.env.MOESIF_APPLICATION_ID,
    TEST_ENV: process.env.TEST_ENV,
    REDIS_URL: process.env.REDIS_URL,

    ETHERSCAN_API_KEY_ETHEREUM: process.env.ETHERSCAN_API_KEY_ETHEREUM,
    ETHERSCAN_API_KEY_BASE: process.env.ETHERSCAN_API_KEY_BASE,
    ETHERSCAN_API_KEY_OPTIMISM: process.env.ETHERSCAN_API_KEY_OPTIMISM,
    ETHERSCAN_API_KEY_ARBITRUM: process.env.ETHERSCAN_API_KEY_ARBITRUM,
    ETHERSCAN_API_KEY_ZKSYNC: process.env.ETHERSCAN_API_KEY_ZKSYNC,
    MORALIS_API_KEY: process.env.MORALIS_API_KEY,
    MINTSCAN_API_KEY: process.env.MINTSCAN_API_KEY,
    BLOCKCHAIR_API_KEY: process.env.BLOCKCHAIR_API_KEY,
    TON_API_KEY: process.env.TON_API_KEY,
    OKLINK_API_KEY: process.env.OKLINK_API_KEY,
    TON_CENTER_API_KEY: process.env.TON_CENTER_API_KEY,
    TRONGRID_API_KEY: process.env.TRONGRID_API_KEY,
    TRONSCAN_API_KEY: process.env.TRONSCAN_API_KEY,
    STARKSCAN_API_KEY: process.env.STARKSCAN_API_KEY,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    SOLANA_VALIDATORS_APP_API_KEY: process.env.SOLANA_VALIDATORS_APP_API_KEY,

    MORALIS_NODE_TOKEN_ETH: process.env.MORALIS_NODE_TOKEN_ETH,
    MORALIS_NODE_TOKEN_SEPOLIA: process.env.MORALIS_NODE_TOKEN_SEPOLIA,
    MORALIS_NODE_TOKEN_HOLESKY: process.env.MORALIS_NODE_TOKEN_HOLESKY,
    MORALIS_NODE_TOKEN_ZKSYNC: process.env.MORALIS_NODE_TOKEN_ZKSYNC,
    MORALIS_NODE_TOKEN_ZKSYNC_SEPOLIA: process.env.MORALIS_NODE_TOKEN_ZKSYNC_SEPOLIA,
    MORALIS_NODE_TOKEN_BASE: process.env.MORALIS_NODE_TOKEN_BASE,
    MORALIS_NODE_TOKEN_BASE_SEPOLIA: process.env.MORALIS_NODE_TOKEN_BASE_SEPOLIA,
    MORALIS_NODE_TOKEN_OPTIMISM: process.env.MORALIS_NODE_TOKEN_OPTIMISM,
    MORALIS_NODE_TOKEN_OPTIMISM_SEPOLIA: process.env.MORALIS_NODE_TOKEN_OPTIMISM_SEPOLIA,
    MORALIS_NODE_TOKEN_ARBITRUM: process.env.MORALIS_NODE_TOKEN_ARBITRUM,
    MORALIS_NODE_TOKEN_ARBITRUM_SEPOLIA: process.env.MORALIS_NODE_TOKEN_ARBITRUM_SEPOLIA,
    MORALIS_NODE_TOKEN_POLYGON: process.env.MORALIS_NODE_TOKEN_POLYGON,
    MORALIS_NODE_TOKEN_AMOY: process.env.MORALIS_NODE_TOKEN_AMOY,
    MORALIS_NODE_TOKEN_BSC: process.env.MORALIS_NODE_TOKEN_BSC,
    MORALIS_NODE_TOKEN_BSC_TESTNET: process.env.MORALIS_NODE_TOKEN_BSC_TESTNET,
    MORALIS_NODE_TOKEN_LINEA: process.env.MORALIS_NODE_TOKEN_LINEA,
    MORALIS_NODE_TOKEN_LINEA_SEPOLIA: process.env.MORALIS_NODE_TOKEN_LINEA_SEPOLIA,
    MORALIS_NODE_TOKEN_AVALANCHE: process.env.MORALIS_NODE_TOKEN_AVALANCHE,
    MORALIS_NODE_TOKEN_GNOSIS: process.env.MORALIS_NODE_TOKEN_GNOSIS,
    MORALIS_NODE_TOKEN_GNOSIS_TESTNET: process.env.MORALIS_NODE_TOKEN_GNOSIS_TESTNET,
    MORALIS_NODE_TOKEN_MOONBEAM: process.env.MORALIS_NODE_TOKEN_MOONBEAM,
    MORALIS_NODE_TOKEN_MOONRIVER: process.env.MORALIS_NODE_TOKEN_MOONRIVER,
    MORALIS_NODE_TOKEN_MOONBASE: process.env.MORALIS_NODE_TOKEN_MOONBASE,
    MORALIS_NODE_TOKEN_MANTLE: process.env.MORALIS_NODE_TOKEN_MANTLE,

    QUICKNODE_TOKEN_COSMOS: process.env.QUICKNODE_TOKEN_COSMOS,
    QUICKNODE_TOKEN_CELESTIA: process.env.QUICKNODE_TOKEN_CELESTIA,
    QUICKNODE_TOKEN_POLYGON: process.env.QUICKNODE_TOKEN_POLYGON,
    QUICKNODE_TOKEN_INJECTIVE: process.env.QUICKNODE_TOKEN_INJECTIVE,
    QUICKNODE_TOKEN_HYPERLIQUID: process.env.QUICKNODE_TOKEN_HYPERLIQUID,
    QUICKNODE_TOKEN_STELLAR: process.env.QUICKNODE_TOKEN_STELLAR,
    QUICKNODE_TOKEN_STELLAR_TESTNET: process.env.QUICKNODE_TOKEN_STELLAR_TESTNET,

    LAVA_GATEWAY_TOKEN: process.env.LAVA_GATEWAY_TOKEN,
  },
});

export { env };
