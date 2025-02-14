import { ALCHEMY_API_KEY } from "~/app/config/apiKeys";
import {
  ChainId,
  FinalizedTransaction,
  Token,
  TokenAmount,
  TokenType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { EvmAddress } from "~/app/families/evm/types";
import {
  AlchemyBalanceRequest,
  AlchemyBlock,
  AlchemyERC20Token,
  AlchemyERC20TokenBalance,
  AlchemyPaginatedRequest,
  AlchemyTransactionWithReceipt,
  AlchemyTransfer,
} from "~/app/families/evm/backend/types";
import { TokenStore } from "~/app/tools/tokenStore";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";

const ALCHEMY_CHAIN_IDS: Map<ChainId, string> = new Map([
  [ChainId.ETHEREUM, "eth-mainnet"],
  [ChainId.SEPOLIA, "eth-sepolia"],
  [ChainId.HOLESKY, "eth-holesky"],
  [ChainId.POLYGON, "polygon-mainnet"],
  [ChainId.POLYGON_AMOY, "polygon-amoy"],
  [ChainId.ARBITRUM, "arb-mainnet"],
  [ChainId.ARBITRUM_SEPOLIA, "arb-sepolia"],
  [ChainId.OPTIMISM, "opt-mainnet"],
  [ChainId.OPTIMISM_SEPOLIA, "opt-sepolia"],
  [ChainId.BASE, "base-mainnet"],
  [ChainId.BASE_SEPOLIA, "base-sepolia"],
  [ChainId.BSC, "bnb-mainnet"],
  [ChainId.BSC_TESTNET, "bnb-testnet"],
  [ChainId.LINEA, "linea-mainnet  "],
  [ChainId.LINEA_SEPOLIA, "linea-sepolia"],
  [ChainId.AVALANCHE, "avax-mainnet"],
  [ChainId.AVALANCHE_FUJI, "avax-mainnet"],
  [ChainId.GNOSIS, "gnosis-mainnet"],
  [ChainId.GNOSIS_CHIADO, "gnosis-chiado"],
]);

function sendRequest(chainId: ChainId, method: string, params: any[]) {
  const alchemyChainId = ALCHEMY_CHAIN_IDS.get(chainId);
  if (!alchemyChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Alchemy API`);
    return Promise.resolve(null);
  }

  return fetch(`https://${alchemyChainId}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
  })
    .then((res) => res.json())
    .then((response) => response.result);
}

// Version that only fetches one single page, depending on the provided paginationToken
async function fetchERC20TokenAmounts(
  chainId: ChainId,
  address: EvmAddress,
  paginationToken?: string
): Promise<{ tokens: TokenAmount[]; nextPage: string | null }> {
  const tokens: TokenAmount[] = [];
  let nextPage: string | null = null;
  const params: any[] = [address, "erc20"];

  const paginationData = paginationFromB64(paginationToken);
  if (paginationData) {
    params.push(paginationData);
  }

  const response: AlchemyPaginatedRequest<AlchemyBalanceRequest> = await sendRequest(
    chainId,
    "alchemy_getTokenBalances",
    params
  );

  const results: AlchemyERC20TokenBalance[] = response?.tokenBalances;
  if (!Array.isArray(results)) {
    return { tokens, nextPage };
  }

  const tokenIds = results.map((tokenBalance) => tokenBalance.contractAddress);
  const cachedTokens = await TokenStore.load(chainId, tokenIds);

  const tokenData = await Promise.all(
    cachedTokens.map((token, index) => token ?? fetchERC20Token(chainId, results[index].contractAddress))
  );

  await TokenStore.save(
    chainId,
    tokenData.filter((token, index) => token !== null && cachedTokens[index] === null)
  );

  for (let i = 0; i < results.length; i++) {
    if (tokenData[i] === null) continue;
    tokens.push({
      token: tokenData[i]!,
      amount: BigInt(results[i].tokenBalance),
    });
  }

  if (response?.pageKey) {
    nextPage = paginationToB64(response.pageKey);
  }

  return { tokens, nextPage };
}

// Version that fully handles pagination, to return all results
async function fetchAllERC20TokenAmounts(chainId: ChainId, address: EvmAddress): Promise<TokenAmount[]> {
  const alchemyChainId = ALCHEMY_CHAIN_IDS.get(chainId);
  if (!alchemyChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Alchemy API`);
    return [];
  }

  let tokenAmounts: TokenAmount[] = [];
  let response;
  let nextPage: string | undefined = undefined;
  do {
    response = await fetchERC20TokenAmounts(chainId, address, nextPage);
    tokenAmounts.push(...response.tokens);
    nextPage = response.nextPage ?? undefined;
  } while (response?.nextPage);

  return tokenAmounts;
}

async function fetchERC20Token(chainId: ChainId, tokenId: EvmAddress): Promise<Token | null> {
  const alchemyChainId = ALCHEMY_CHAIN_IDS.get(chainId);
  if (!alchemyChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Alchemy API`);
    return null;
  }

  const response: AlchemyERC20Token = await sendRequest(chainId, "alchemy_getTokenMetadata", [tokenId]);
  if (response === null || response.decimals === null) {
    return null;
  }

  return {
    type: TokenType.ERC20,
    id: tokenId,
    name: response.name,
    ticker: response.symbol,
    decimals: response.decimals,
    contractAddress: tokenId,
    logo: response.logo ?? undefined,
  };
}

async function fetchTransaction(
  chainId: ChainId,
  transactionId: string
): Promise<AlchemyTransactionWithReceipt | null> {
  const alchemyChainId = ALCHEMY_CHAIN_IDS.get(chainId);
  if (!alchemyChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Alchemy API`);
    return Promise.resolve(null);
  }
  const transaction: AlchemyTransactionWithReceipt = await sendRequest(chainId, "eth_getTransactionByHash", [
    transactionId,
  ]);
  transaction.receipt = await sendRequest(chainId, "eth_getTransactionReceipt", [transactionId]);

  return transaction;
}

// FIXME: Handle ERC20 transfers
async function alchemyToAdamikAccountTransaction(
  chainId: ChainId,
  alchemyTransaction: AlchemyTransfer
): Promise<FinalizedTransaction["parsed"] | null> {
  const transaction = await fetchTransaction(chainId, alchemyTransaction.hash);
  if (!transaction || !transaction.receipt) return null;
  const block: AlchemyBlock = await sendRequest(chainId, "eth_getBlockByNumber", [
    alchemyTransaction.blockNum,
    false,
  ]);
  const timestamp = parseInt(block.timestamp);

  const gasPrice = BigInt(transaction.receipt.effectiveGasPrice ?? 0);
  const gasUsed = BigInt(transaction.receipt.cumulativeGasUsed ?? 0);
  const feesAmount = gasPrice * gasUsed;

  return {
    id: alchemyTransaction.hash,
    timestamp,
    fees: {
      amount: feesAmount,
    },
    gas: gasUsed,
    nonce: BigInt(transaction.nonce ?? 0),
    // Placeholder values, actual values filled below
    mode: TransactionMode.TRANSFER,
    state: TransactionState.CONFIRMED,
    senders: [
      {
        address: transaction.from,
        amount: BigInt(transaction.value),
      },
    ],
    recipients: [
      {
        address: transaction.to,
        amount: BigInt(transaction.value),
      },
    ],
  };
}

export {
  fetchAllERC20TokenAmounts,
  fetchERC20Token,
  fetchERC20TokenAmounts,
  fetchTransaction,
  ALCHEMY_CHAIN_IDS,
  alchemyToAdamikAccountTransaction,
};
