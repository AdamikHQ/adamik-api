import BigNumber from "bignumber.js";
import { MORALIS_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  FinalizedTransaction,
  Token,
  TokenAmount,
  TokenType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import {
  InvalidPaginationTokenError,
  ThirdPartyProviderError,
  UnsupportedTokenIDError,
} from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "../../common";
import { EvmAddress } from "../types";
import {
  MoralisAccountTransaction,
  MoralisAccountTransactionsResponse,
  MoralisERC20Token,
  MoralisERC20TokenBalance,
  MoralisTransaction,
} from "./types";

const MORALIS_CHAIN_IDS: Map<ChainId, string> = new Map([
  [ChainId.ETHEREUM, "eth"],
  [ChainId.SEPOLIA, "sepolia"],
  [ChainId.HOLESKY, "holesky"],
  [ChainId.POLYGON, "polygon"],
  [ChainId.POLYGON_AMOY, "polygon amoy"],
  [ChainId.ARBITRUM, "arbitrum"],
  // no indexer for Sepolia with Moralis, to update later or switch to Etherscan
  // [ChainId.ARBITRUM_SEPOLIA, "arbitrum sepolia"],
  [ChainId.OPTIMISM, "optimism"],
  // no indexer for Sepolia with Moralis, to update later or switch to Etherscan
  // [ChainId.OPTIMISM_SEPOLIA, "optimism sepolia"],
  [ChainId.BASE, "base"],
  [ChainId.BASE_SEPOLIA, "base sepolia"],
  [ChainId.BSC, "bsc"],
  [ChainId.BSC_TESTNET, "bsc testnet"],
  [ChainId.LINEA, "linea"],
  [ChainId.LINEA_SEPOLIA, "linea sepolia"],
  [ChainId.AVALANCHE, "avalanche"],
  [ChainId.GNOSIS, "gnosis"],
  [ChainId.GNOSIS_CHIADO, "gnosis testnet"],
  [ChainId.MOONBEAM, "moonbeam"],
  [ChainId.MOONRIVER, "moonriver"],
  [ChainId.MOONBASE, "moonbase"],
  [ChainId.FANTOM, "fantom"],
  //Mantle may not be supported yet (marked as coming soon by Moralis)
  //[ChainId.MANTLE, "mantle"],
]);

async function fetchWithHeaders(url: string, options: RequestInit = {}) {
  const newOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      "X-API-Key": MORALIS_API_KEY,
    },
  };

  return fetch(url, newOptions);
}

// Version that only fetches one single page, depending on the provided paginationToken
async function fetchERC20TokenAmounts(
  chainId: ChainId,
  address: EvmAddress,
  paginationToken?: string
): Promise<{ tokens: TokenAmount[]; nextPage: string | null }> {
  let tokens: TokenAmount[] = [];
  let nextPage: string | null = null;

  const moralisChainId = MORALIS_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return { tokens, nextPage };
  }

  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return { tokens, nextPage };
  }

  const paginationData = paginationFromB64(paginationToken);
  if (paginationData && typeof paginationData !== "string") {
    throw new InvalidPaginationTokenError("Provided pagination token is invalid");
  }

  const queryParams = new URLSearchParams({
    chain: moralisChainId,
    exclude_spam: "false",
    limit: "20", // Smaller pages if pagination is requested
    cursor: paginationData,
  });

  const url = `${explorerURL}/v2.2/wallets/${address}/tokens?${queryParams}`;

  const response = await fetchWithHeaders(url).then((response) => response.json());

  const results: MoralisERC20TokenBalance[] = response?.result;
  if (!Array.isArray(results)) {
    return { tokens, nextPage };
  }

  results
    // Moralis includes an "ETH" token in the results, labeled as native_token: true
    // so we need to remove these from the results
    ?.filter((tokenData: MoralisERC20TokenBalance) => !tokenData.native_token)
    .forEach((result) =>
      tokens.push({
        token: {
          chainId,
          type: TokenType.ERC20,
          id: result.token_address,
          name: result.name,
          decimals: result.decimals,
          ticker: result.symbol,
          contractAddress: result.token_address,
        },
        amount: BigInt(result.balance),
      })
    );

  if (response?.cursor) {
    nextPage = paginationToB64(response.cursor);
  }

  return { tokens, nextPage };
}

// Version that fully handles pagination, to return all results
async function fetchAllERC20TokenAmounts(chainId: ChainId, address: EvmAddress): Promise<TokenAmount[]> {
  const moralisChainId = MORALIS_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return [];
  }

  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return [];
  }

  let tokenAmounts: TokenAmount[] = [];
  let response;
  do {
    const queryParams = new URLSearchParams({
      chain: moralisChainId,
      exclude_spam: "false",
      limit: "200", // Larger pages if all pagination is handled in one request
    });

    if (response?.cursor) {
      queryParams.append("cursor", response.cursor);
    }

    const url = `${explorerURL}/v2.2/wallets/${address}/tokens?${queryParams}`;

    response = await fetchWithHeaders(url).then((response) => response.json());

    const results: MoralisERC20TokenBalance[] = response?.result;
    if (!Array.isArray(results)) {
      break;
    }

    results
      // Moralis includes an "ETH" token in the results, labeled as native_token: true
      // so we need to remove these from the results
      ?.filter((tokenData: MoralisERC20TokenBalance) => !tokenData.native_token)
      .forEach((result) =>
        tokenAmounts.push({
          token: {
            chainId,
            type: TokenType.ERC20,
            id: result.token_address,
            name: result.name,
            decimals: result.decimals,
            ticker: result.symbol,
            contractAddress: result.token_address,
          },
          amount: BigInt(result.balance),
        })
      );
  } while (response?.cursor);

  return tokenAmounts;
}

async function fetchERC20Token(chainId: ChainId, tokenId: EvmAddress): Promise<Token> {
  const moralisChainId = MORALIS_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    throw new UnsupportedTokenIDError(tokenId, chainId);
  }

  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    throw new UnsupportedTokenIDError(tokenId, chainId);
  }

  const queryParams = new URLSearchParams({
    chain: moralisChainId,
    "addresses[0]": tokenId,
  });

  const url = `${explorerURL}/v2.2/erc20/metadata?${queryParams}`;

  const response = await fetchWithHeaders(url).then((response) => response.json());

  if (response.message === `addresses with value '${tokenId}' is not a valid hex address`) {
    throw new UnsupportedTokenIDError(tokenId, chainId);
  }

  try {
    // Array destructuring, we only need the 1st item
    const [result]: [MoralisERC20Token] = response;

    return {
      chainId: chainId,
      type: TokenType.ERC20,
      id: result.address,
      name: result.name,
      ticker: result.symbol,
      decimals: result.decimals,
      contractAddress: result.address,
    };
  } catch (e) {
    console.warn(`/!\\ Invalid response from ${chainId} explorer endpoint: ${url.toString()}:`, response);
    throw new ThirdPartyProviderError(`Invalid data in response from explorer for chain ID ${chainId}`);
  }
}

async function fetchTransaction(chainId: ChainId, transactionId: string): Promise<MoralisTransaction | null> {
  const moralisChainId = MORALIS_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return null;
  }

  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return null;
  }

  const queryParams = new URLSearchParams({
    chain: moralisChainId,
  });

  const url = `${explorerURL}/v2.2/transaction/${transactionId}/verbose?${queryParams}`;

  const result: MoralisTransaction | { message: string } = await fetchWithHeaders(url).then((response) =>
    response.json()
  );

  if ("message" in result) {
    return null;
  }

  return result;
}

async function fetchAccountTransactions(
  chainId: ChainId,
  address: EvmAddress,
  paginationToken?: string
): Promise<{ evmTransactions: MoralisAccountTransaction[]; nextPage: string | null }> {
  const moralisChainId = MORALIS_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return { evmTransactions: [], nextPage: null };
  }

  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return { evmTransactions: [], nextPage: null };
  }

  const paginationData = paginationFromB64(paginationToken);
  if (paginationData && typeof paginationData !== "string") {
    throw new InvalidPaginationTokenError("Provided pagination token is invalid");
  }

  const queryParams = new URLSearchParams({
    chain: moralisChainId,
    order: "DESC",
    cursor: paginationData,
    // For now, we're not interested in internal transactions and NFTs
    include_internal_transactions: "false",
    nft_metadata: "false",
  });

  const url = `${explorerURL}/v2.2/wallets/${address}/history?${queryParams}`;

  const response: MoralisAccountTransactionsResponse = await fetchWithHeaders(url.toString()).then(
    (response) => response.json()
  );

  if (!Array.isArray(response?.result)) {
    console.warn(`/!\\ Invalid response from ${chainId} explorer endpoint: ${url.toString()}:`, response);
    return { evmTransactions: [], nextPage: null };
  }

  return {
    evmTransactions: response.result,
    nextPage: paginationToB64(response.cursor),
  };
}

function moralisToAdamikTransaction(
  chainId: ChainId,
  moralisTransaction: MoralisTransaction
): FinalizedTransaction["parsed"] {
  const chain = CHAINS[chainId];

  // Moralis bug ? For some reason, transaction_fee is NOT in smallest unit... so we need to convert it
  const feesBN = new BigNumber(moralisTransaction.transaction_fee).multipliedBy(Math.pow(10, chain.decimals));
  const feesAmount = feesBN.isNaN() ? 0n : BigInt(feesBN.toFixed());

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId,
    id: moralisTransaction.hash,
    timestamp: new Date(moralisTransaction.block_timestamp).getTime(),
    fees: {
      amount: feesAmount,
    },
    gas: BigInt(moralisTransaction.receipt_gas_used),
    nonce: BigInt(moralisTransaction.nonce),
    // Placeholder values, actual values filled below
    mode: "unknown",
    state: TransactionState.UNKNOWN,
  };

  if (moralisTransaction.block_number) {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = BigInt(moralisTransaction.block_number);
  }

  const decodedCall = moralisTransaction.decoded_call;
  if (!moralisTransaction.decoded_call) {
    parsedTransaction.mode = TransactionMode.TRANSFER;

    parsedTransaction.senders = [
      {
        address: moralisTransaction.from_address,
        amount: BigInt(moralisTransaction.value),
      },
    ];

    parsedTransaction.recipients = [
      {
        address: moralisTransaction.to_address,
        amount: BigInt(moralisTransaction.value),
      },
    ];
  } else if (decodedCall.type === "function" && decodedCall.label === "transfer") {
    parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
    parsedTransaction.tokenId = moralisTransaction.to_address;

    const recipientAddress = decodedCall.params.find((param) => param.name === "_to")?.value || "";
    const amount = decodedCall.params.find((param) => param.name === "_value")?.value;
    if (!amount) {
      console.warn(
        `/!\\ Invalid transaction data in response from explorer for chainId ${chainId}:`,
        moralisTransaction
      );
      throw new ThirdPartyProviderError(`Invalid data in response from explorer for chain ID ${chainId}`);
    }

    parsedTransaction.senders = [
      {
        address: moralisTransaction.from_address,
        amount: BigInt(amount),
      },
    ];

    parsedTransaction.recipients = [
      {
        address: recipientAddress,
        amount: BigInt(amount),
      },
    ];
  }

  return parsedTransaction;
}

function moralisToAdamikAccountTransaction(
  chainId: ChainId,
  moralisTransaction: MoralisAccountTransaction
): FinalizedTransaction["parsed"] {
  const chain = CHAINS[chainId];

  // Moralis bug ? For some reason, transaction_fee is NOT in smallest unit... so we need to convert it
  const feesBN = new BigNumber(moralisTransaction.transaction_fee).multipliedBy(Math.pow(10, chain.decimals));
  const feesAmount = feesBN.isNaN() ? 0n : BigInt(feesBN.toFixed());

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId,
    id: moralisTransaction.hash,
    timestamp: new Date(moralisTransaction.block_timestamp).getTime(),
    fees: {
      amount: feesAmount,
    },
    gas: BigInt(moralisTransaction.receipt_gas_used),
    nonce: BigInt(moralisTransaction.nonce),
    // Placeholder values, actual values filled below
    mode: "unknown",
    state: TransactionState.UNKNOWN,
  };

  if (moralisTransaction.block_number) {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = BigInt(moralisTransaction.block_number);
  }

  if (moralisTransaction.native_transfers?.length) {
    if (["send", "receive"].includes(moralisTransaction.category)) {
      parsedTransaction.mode = TransactionMode.TRANSFER;
    }

    const moralisNativeTransfer = moralisTransaction.native_transfers[0];

    parsedTransaction.senders = [
      {
        address: moralisNativeTransfer.from_address,
        amount: BigInt(moralisNativeTransfer.value),
      },
    ];

    parsedTransaction.recipients = [
      {
        address: moralisNativeTransfer.to_address,
        amount: BigInt(moralisNativeTransfer.value),
      },
    ];
  } else if (moralisTransaction.erc20_transfers?.length) {
    const moralisErc20Transfer = moralisTransaction.erc20_transfers[0];
    parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
    parsedTransaction.tokenId = moralisErc20Transfer.address;

    parsedTransaction.senders = [
      {
        address: moralisErc20Transfer.from_address,
        amount: BigInt(moralisErc20Transfer.value),
      },
    ];

    parsedTransaction.recipients = [
      {
        address: moralisErc20Transfer.to_address,
        amount: BigInt(moralisErc20Transfer.value),
      },
    ];
  }

  return parsedTransaction;
}

export {
  fetchAccountTransactions,
  fetchAllERC20TokenAmounts,
  fetchERC20Token,
  fetchERC20TokenAmounts,
  fetchTransaction,
  MORALIS_CHAIN_IDS,
  moralisToAdamikAccountTransaction,
  moralisToAdamikTransaction,
};
