import { AbiFunctionSignatureNotFoundError, decodeFunctionData, erc20Abi } from "viem";
import {
  AlchemyBalanceRequest,
  AlchemyBlock,
  AlchemyERC20TokenBalance,
  AlchemyPaginatedRequest,
  AlchemyTransactionWithReceipt,
  AlchemyTransfer,
} from "~/app/families/evm/backend/alchemy.types";
import { EvmAddress, EvmIndexer } from "~/app/families/evm/types";
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
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { TokenStore } from "~/app/tools/tokenStore";
import { getProviderUrls } from "../../common";
import { parseStakewiseTransaction } from "../logic";

// FIXME /!\ Alchemy = VERY bad performance for tx history
// Because the Alchemy history API is s***, there's no choice but to fetch
// each individual transaction one by one for additional info...
// https://www.alchemy.com/docs/data/transfers-api/transfers-endpoints/alchemy-get-asset-transfers

async function sendRequest(chainId: ChainId, method: string, params: any[]) {
  const alchemyURL = getProviderUrls(chainId, ProviderType.alchemy)[0];

  const res = await fetch(alchemyURL, {
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
  });
  const response = await res.json();
  if (response.error) {
    console.warn(`/!\\ Alchemy request failed: ${response.error.message}`);
    throw new ThirdPartyProviderError("Request failed");
  }
  return response.result;
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

// FIXME Impossible to support pagination because from / to transactions are handled separately...
async function fetchAccountTransactions(
  chainId: ChainId,
  address: EvmAddress,
  paginationToken?: string
): Promise<{ evmTransactions: FinalizedTransaction[]; nextPage: string | null }> {
  const txGenericParams = {
    fromBlock: "0x0",
    toBlock: "latest",
    order: "desc",
    withMetadata: true,
    excludeZeroValue: true,
    maxCount: "0x3e8",
    category: ["external", "erc20"],
  };

  const { transfers: transfersFrom } = await sendRequest(chainId, "alchemy_getAssetTransfers", [
    {
      ...txGenericParams,
      fromAddress: address,
    },
  ]);
  const { transfers: transfersTo } = await sendRequest(chainId, "alchemy_getAssetTransfers", [
    {
      ...txGenericParams,
      toAddress: address,
    },
  ]);

  if (!Array.isArray(transfersFrom) || !Array.isArray(transfersTo)) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer request alchemy_getAssetTransfers:`,
      transfersFrom,
      transfersTo
    );
    return {
      evmTransactions: [],
      nextPage: null,
    };
  }

  const transactions = [...transfersFrom, ...transfersTo];
  transactions.sort(
    (a: AlchemyTransfer, b: AlchemyTransfer) => parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16)
  );

  const formattedTransactions = await Promise.all(
    transactions.map((tx: AlchemyTransfer) => alchemyToAdamikAccountTransaction(chainId, tx))
  );

  return {
    evmTransactions: formattedTransactions.filter(Boolean) as FinalizedTransaction[],
    nextPage: null,
  };
}

async function alchemyToAdamikTransaction(
  chainId: ChainId,
  alchemyTransaction: AlchemyTransactionWithReceipt
): Promise<FinalizedTransaction> {
  const block: AlchemyBlock = await sendRequest(chainId, "eth_getBlockByNumber", [
    alchemyTransaction.blockNumber,
    false,
  ]);
  const feesAmount =
    BigInt(alchemyTransaction.receipt.gasUsed) * BigInt(alchemyTransaction.receipt.effectiveGasPrice);

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: alchemyTransaction.hash,
    timestamp: parseInt(block.timestamp, 16) * 1000,
    fees: {
      amount: feesAmount,
    },
    gas: BigInt(alchemyTransaction.receipt.gasUsed),
    nonce: BigInt(alchemyTransaction.nonce),
    mode: "unknown",
    state: TransactionState.UNKNOWN,
    senders: [
      {
        address: alchemyTransaction.from,
        amount: BigInt(alchemyTransaction.value),
      },
    ],
    recipients: [
      {
        address: alchemyTransaction.to,
        amount: BigInt(alchemyTransaction.value),
      },
    ],
  };

  if (alchemyTransaction.blockNumber) {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = BigInt(alchemyTransaction.blockNumber);
  }

  if (alchemyTransaction.input === "0x") {
    // Simple transfer
    parsedTransaction.mode = TransactionMode.TRANSFER;
  } else {
    // Staking transaction? (with stakewise)
    try {
      return await parseStakewiseTransaction(chainId, alchemyTransaction, parsedTransaction);
    } catch (error) {
      if (!(error instanceof AbiFunctionSignatureNotFoundError)) {
        throw error;
      }
      // Not found on Stakewise ABI = not a staking tx
    }

    // Token transfer?
    try {
      const erc20DecodedCall = decodeFunctionData({
        abi: erc20Abi,
        data: alchemyTransaction.input,
      });

      if (["transfer", "transferFrom"].includes(erc20DecodedCall.functionName)) {
        parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;

        parsedTransaction.tokenId = alchemyTransaction.to;

        parsedTransaction.senders = [
          {
            address: alchemyTransaction.from,
            amount: BigInt(erc20DecodedCall.args[1]!),
          },
        ];

        parsedTransaction.recipients = [
          {
            address: erc20DecodedCall.args[0]!,
            amount: BigInt(erc20DecodedCall.args[1]!),
          },
        ];
      }
    } catch (error) {
      if (!(error instanceof AbiFunctionSignatureNotFoundError)) {
        throw error;
      }
      // Not found on ERC20 ABI = not a token transfer tx
    }
  }

  return {
    parsed: parsedTransaction,
    raw: alchemyTransaction,
  };
}

async function alchemyToAdamikAccountTransaction(
  chainId: ChainId,
  alchemyTransaction: AlchemyTransfer
): Promise<FinalizedTransaction | null> {
  return fetchTransaction(chainId, alchemyTransaction.hash);
}

export const AlchemyIndexer: EvmIndexer = {
  fetchAccountTransactions,
  fetchAllERC20TokenAmounts,
  fetchERC20Token,
  fetchERC20TokenAmounts,
  fetchTransaction,
};
