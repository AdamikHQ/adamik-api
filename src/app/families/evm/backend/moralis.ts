import BigNumber from "bignumber.js";
import { AbiFunctionSignatureNotFoundError } from "viem";
import { MORALIS_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  FinalizedTransaction,
  ProviderType,
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
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { TokenStore } from "~/app/tools/tokenStore";
import { getProviderUrls } from "../../common";
import { parseStakewiseTransaction } from "../logic";
import { EvmAddress, EvmIndexer } from "../types";
import {
  MORALIS_SUPPORTED_CHAIN_IDS,
  MoralisERC20Token,
  MoralisERC20TokenBalance,
  MoralisTransaction,
  MoralisTransactionsResponse,
} from "./moralis.types";

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

  const moralisChainId = MORALIS_SUPPORTED_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return { tokens, nextPage };
  }

  const explorerURL = getProviderUrls(chainId, ProviderType.moralis)[0];
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return { tokens, nextPage };
  }

  const searchParams = new URLSearchParams({
    chain: moralisChainId,
    exclude_spam: "false",
    limit: "20", // Smaller pages when pagination is requested
  });

  const paginationData = paginationFromB64(paginationToken);
  if (paginationData) {
    if (typeof paginationData === "string") {
      searchParams.set("cursor", paginationData);
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const url = `${explorerURL}/v2.2/wallets/${address}/tokens?${searchParams}`;

  const response = await fetchWithHeaders(url).then((response) => response.json());

  if (response.message === "Cursor is invalid or expired") {
    console.warn(`/!\\ Error response from ${chainId} explorer endpoint ${url.toString()}:`, response);
    throw new InvalidPaginationTokenError(`Pagination token is invalid or expired`);
  }

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
  const moralisChainId = MORALIS_SUPPORTED_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return [];
  }

  const explorerURL = getProviderUrls(chainId, ProviderType.moralis)[0];
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
      limit: "100", // Larger pages if all pagination is handled in one request
    });

    if (response && response.cursor) {
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
  const [existingToken] = await TokenStore.load(chainId, [tokenId]);
  if (existingToken !== null) {
    return existingToken;
  }
  const moralisChainId = MORALIS_SUPPORTED_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    throw new UnsupportedTokenIDError(tokenId, chainId);
  }

  const explorerURL = getProviderUrls(chainId, ProviderType.moralis)[0];
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

    const token = {
      type: TokenType.ERC20,
      id: result.address,
      name: result.name,
      ticker: result.symbol,
      decimals: result.decimals,
      contractAddress: result.address,
    };
    await TokenStore.save(chainId, [token]);
    return token;
  } catch (e) {
    console.warn(`/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`, response);
    throw new ThirdPartyProviderError(`Invalid data in response from explorer for chain ID ${chainId}`);
  }
}

async function fetchTransaction(
  chainId: ChainId,
  transactionId: string
): Promise<FinalizedTransaction | null> {
  const moralisChainId = MORALIS_SUPPORTED_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return null;
  }

  const explorerURL = getProviderUrls(chainId, ProviderType.moralis)[0];
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

  return await moralisToAdamikTransaction(chainId, result);
}

async function fetchAccountTransactions(
  chainId: ChainId,
  address: EvmAddress,
  paginationToken?: string
): Promise<{ evmTransactions: FinalizedTransaction[]; nextPage: string | null }> {
  const moralisChainId = MORALIS_SUPPORTED_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return { evmTransactions: [], nextPage: null };
  }

  const explorerURL = getProviderUrls(chainId, ProviderType.moralis)[0];
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return { evmTransactions: [], nextPage: null };
  }

  const searchParams = new URLSearchParams({
    chain: moralisChainId,
    order: "DESC",
    // For now, we're not interested in internal transactions and NFTs
    include_internal_transactions: "false",
    nft_metadata: "false",
  });

  const paginationData = paginationFromB64(paginationToken);
  if (paginationData) {
    if (typeof paginationData === "string") {
      searchParams.set("cursor", paginationData);
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const url = `${explorerURL}/v2.2/${address}/verbose?${searchParams}`;

  const response: MoralisTransactionsResponse = await fetchWithHeaders(url.toString()).then((response) =>
    response.json()
  );

  if (response?.message === "Cursor is invalid or expired") {
    console.warn(`/!\\ Error response from ${chainId} explorer endpoint ${url.toString()}:`, response);
    throw new InvalidPaginationTokenError(`Pagination token is invalid or expired`);
  }

  if (!Array.isArray(response?.result)) {
    console.warn(`/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`, response);
    return { evmTransactions: [], nextPage: null };
  }

  const evmTransactions = await Promise.all(
    response.result.map((result: MoralisTransaction) => moralisToAdamikTransaction(chainId, result))
  );

  return {
    evmTransactions,
    nextPage: paginationToB64(response.cursor),
  };
}

async function moralisToAdamikTransaction(
  chainId: ChainId,
  moralisTransaction: MoralisTransaction
): Promise<FinalizedTransaction> {
  const chain = CHAINS[chainId];

  // Moralis bug ? For some reason, transaction_fee is NOT in smallest unit... so we need to convert it
  const feesBN = new BigNumber(moralisTransaction.transaction_fee).multipliedBy(Math.pow(10, chain.decimals));
  const feesAmount = feesBN.isNaN() ? 0n : BigInt(feesBN.toFixed());

  const parsedTransaction: FinalizedTransaction["parsed"] = {
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

  // Some exotic transactions have unexpected and unsupported data
  // e.g : https://etherscan.io/tx/0x92c6783d272db725df2f737cdf0402f36bf419f954be7aebb2730ac7097bc800
  if (!moralisTransaction.from_address || !moralisTransaction.to_address) {
    return {
      parsed: parsedTransaction,
      raw: moralisTransaction,
    };
  } else {
    parsedTransaction.senders = [
      {
        address: moralisTransaction.from_address,
        amount: BigInt(moralisTransaction.value),
      },
    ];
  }

  // Token transfer?
  const moralisDecodedCall = moralisTransaction.decoded_call;
  if (
    moralisDecodedCall?.type === "function" &&
    ["transfer", "transferFrom"].includes(moralisDecodedCall?.label)
  ) {
    parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
    parsedTransaction.tokenId = moralisTransaction.to_address;

    const recipientAddress = moralisDecodedCall.params.find((param) => param.name === "_to")?.value || "";
    const amount = moralisDecodedCall.params.find(
      (param) => param.name === "_value" || param.name === "_amount"
    )?.value;

    if (amount === undefined) {
      console.warn(
        `/!\\ Invalid transaction data in response from explorer for chainId ${chainId}:`,
        JSON.stringify(moralisTransaction)
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
    return {
      parsed: parsedTransaction,
      raw: moralisTransaction,
    };
  }

  // Staking transaction? (with stakewise)
  try {
    return await parseStakewiseTransaction(chainId, moralisTransaction, parsedTransaction);
  } catch (error) {
    if (!(error instanceof AbiFunctionSignatureNotFoundError)) {
      throw error;
    }
    // Not found on Stakewise ABI = not a staking tx
  }

  // Simple transfer
  if (moralisTransaction.input === "0x") {
    parsedTransaction.mode = TransactionMode.TRANSFER;

    parsedTransaction.recipients = [
      {
        address: moralisTransaction.to_address,
        amount: BigInt(moralisTransaction.value),
      },
    ];
  }

  return {
    parsed: parsedTransaction,
    raw: moralisTransaction,
  };
}

export const MoralisIndexer: EvmIndexer = {
  fetchAccountTransactions,
  fetchAllERC20TokenAmounts,
  fetchERC20Token,
  fetchERC20TokenAmounts,
  fetchTransaction,
};
