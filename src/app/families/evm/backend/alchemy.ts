import {
  Backend,
  ChainId,
  FinalizedTransaction,
  ProviderType,
  Token,
  TokenAmount,
  TokenType,
  TransactionState,
} from "~/app/model/types_WIP";
import { EvmAddress } from "~/app/families/evm/types";
import {
  AlchemyBalanceRequest,
  AlchemyBlock,
  AlchemyERC20Token,
  AlchemyERC20TokenBalance,
  AlchemyPaginatedRequest,
  AlchemyTransaction,
  AlchemyTransactionWithReceipt,
  AlchemyTransfer,
  EvmIndexer,
} from "~/app/families/evm/backend/types";
import { TokenStore } from "~/app/tools/tokenStore";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { CHAINS } from "~/app/config/chains";

const CHAIN_IDS: Map<ChainId, string> = new Map([
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
  [ChainId.MONAD_TESTNET, "monad-testnet"],
]);

function sendRequest(chainId: ChainId, method: string, params: any[]) {
  const explorer = CHAINS[chainId].backends.find((b: Backend) => b.providerType === ProviderType.alchemy);
  if (!explorer) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Alchemy API`);
    return Promise.resolve(null);
  }

  return fetch(explorer.url, {
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

async function fetchERC20Token(chainId: ChainId, tokenId: EvmAddress): Promise<Token> {
  let [token] = await TokenStore.load(chainId, [tokenId]);
  if (token !== null) {
    return token;
  }
  const response = await sendRequest(chainId, "alchemy_getTokenMetadata", [tokenId]);
  if (response === null || response.error) {
    throw new Error(response?.error?.message ?? `Can't find token metadata for ${tokenId}`);
  }

  token = {
    type: TokenType.ERC20,
    id: tokenId,
    name: response?.name ?? "",
    ticker: response?.symbol ?? "",
    decimals: response?.decimals ?? 0,
    contractAddress: tokenId,
    logo: response?.logo ?? undefined,
  };
  await TokenStore.save(chainId, [token]);
  return token;
}

async function fetchTransaction(
  chainId: ChainId,
  transactionId: string
): Promise<FinalizedTransaction | null> {
  const transaction: AlchemyTransactionWithReceipt = await sendRequest(chainId, "eth_getTransactionByHash", [
    transactionId,
  ]);
  if (transaction === null) {
    return null;
  }
  transaction.receipt = await sendRequest(chainId, "eth_getTransactionReceipt", [transactionId]);

  return await alchemyToAdamikTransaction(chainId, transaction);
}

async function fetchAccountTransactions(
  chainId: ChainId,
  address: EvmAddress,
  paginationToken?: string
): Promise<{ evmTransactions: FinalizedTransaction[]; nextPage: string | null }> {
  const txGenericParams = {
    fromBlock: "0x0",
    toBlock: "latest",
    withMetadata: false,
    excludeZeroValue: true,
    maxCount: "0x3e8",
    category: ["external", "erc20"],
  };

  const [responseFrom, responseTo]: [AlchemyTransfer[], AlchemyTransfer[]] = await Promise.all([
    sendRequest(chainId, "alchemy_getAssetTransfers", [
      {
        ...txGenericParams,
        from: address,
      },
    ]),
    sendRequest(chainId, "alchemy_getAssetTransfers", [
      {
        ...txGenericParams,
        to: address,
      },
    ]),
  ]);
  if (!Array.isArray(responseFrom) || !Array.isArray(responseTo)) {
    console.warn(`/!\\ Invalid response from ${chainId} (explorer: Alchemy)`, responseFrom, responseTo);
    return {
      evmTransactions: [],
      nextPage: null,
    };
  }

  const response = [...responseFrom, ...responseTo];
  response.sort(
    (a: AlchemyTransfer, b: AlchemyTransfer) => parseInt(a.blockNum, 16) - parseInt(b.blockNum, 16)
  );
  const formattedTransactions = await Promise.all(
    response.map((tx: AlchemyTransfer) => alchemyToAdamikAccountTransaction(chainId, tx))
  );

  return {
    evmTransactions: formattedTransactions.filter(Boolean) as FinalizedTransaction[],
    nextPage: null,
  };
}

async function alchemyToAdamikTransaction(
  chainId: ChainId,
  alchemyTransaction: AlchemyTransaction
): Promise<FinalizedTransaction> {
  const block: AlchemyBlock = await sendRequest(chainId, "eth_getBlockByNumber", [
    alchemyTransaction.blockNumber,
    false,
  ]);
  const feesAmount = BigInt(alchemyTransaction.gas) * BigInt(alchemyTransaction.gasPrice);

  return {
    parsed: {
      id: alchemyTransaction.hash,
      timestamp: parseInt(block.timestamp, 16) * 1000,
      fees: {
        amount: feesAmount,
      },
      gas: BigInt(alchemyTransaction.gas),
      nonce: BigInt(alchemyTransaction.nonce),
      // FIXME: Supported modes
      mode: "unknown",
      state: TransactionState.CONFIRMED,
    },
    raw: {
      hash: alchemyTransaction.hash,
      from: alchemyTransaction.from,
      to: alchemyTransaction.to,
      blockNumber: alchemyTransaction.blockNumber,
      nonce: alchemyTransaction.nonce,
      input: alchemyTransaction.input,
      value: alchemyTransaction.value,
      gas: alchemyTransaction.gas,
      gasPrice: alchemyTransaction.gasPrice,
      chainId: CHAINS[chainId].nativeId,
    },
  };
}

async function alchemyToAdamikAccountTransaction(
  chainId: ChainId,
  alchemyTransaction: AlchemyTransfer
): Promise<FinalizedTransaction | null> {
  const transaction = await fetchTransaction(chainId, alchemyTransaction.hash);
  if (!transaction || !transaction.parsed) return null;

  transaction.parsed.senders = [
    {
      address: alchemyTransaction.from,
      amount: BigInt(alchemyTransaction.value),
    },
  ];
  transaction.parsed.recipients = [
    {
      address: alchemyTransaction.to,
      amount: BigInt(alchemyTransaction.value),
    },
  ];
  return transaction;
}

export const AlchemyIndexer = {
  fetchAccountTransactions,
  fetchAllERC20TokenAmounts,
  fetchERC20Token,
  fetchERC20TokenAmounts,
  fetchTransaction,
  CHAIN_IDS,
} as EvmIndexer;
