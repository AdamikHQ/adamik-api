import BigNumber from "bignumber.js";
import { MORALIS_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import {
  AccountHistoryPagination,
  ChainId,
  FinalizedTransaction,
  Token,
  TokenAmount,
  TokenType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";
import { EvmAddress } from "../types";
import { MoralisAccountTransaction, MoralisERC20Token, MoralisERC20TokenBalance } from "./types";

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

async function fetchWithPagination<T>(chainId: ChainId, urlString: string, dataKey: string): Promise<T[]> {
  const url = new URL(urlString);

  let data: T[] = [];
  let response;
  do {
    if (response?.cursor) {
      url.searchParams.set("cursor", response.cursor);
    }

    response = await fetchWithHeaders(url.toString()).then((response) => response.json());

    if (!response || !Array.isArray(response[dataKey])) {
      console.warn(`/!\\ Invalid response from ${chainId} explorer endpoint: ${url.toString()}:`, response);
      break;
    }

    data = data.concat(response[dataKey]);
  } while (response?.cursor);

  return data;
}

// NOTE Unused at the moment, could serve as replacement for getting transactions from the node
/*
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
*/

async function fetchERC20TokenAmounts(chainId: ChainId, address: EvmAddress): Promise<TokenAmount[]> {
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
  let data;
  do {
    const queryParams = new URLSearchParams({
      chain: moralisChainId,
      exclude_spam: "false",
      limit: "200",
    });

    if (data?.cursor) {
      queryParams.append("cursor", data.cursor);
    }

    const url = `${explorerURL}/v2.2/wallets/${address}/tokens?${queryParams}`;

    data = await fetchWithHeaders(url).then((response) => response.json());

    const results: MoralisERC20TokenBalance[] = data?.result;
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
  } while (data?.cursor);

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

  // (array destructuring, we only need the 1st item)
  const [result]: [MoralisERC20Token] = await fetchWithHeaders(url).then((response) => response.json());

  return {
    chainId: chainId,
    type: TokenType.ERC20,
    id: result.address,
    name: result.name,
    ticker: result.symbol,
    decimals: result.decimals,
    contractAddress: result.address,
  };
}

// https://docs.moralis.com/web3-data-api/evm/wallet-history
async function fetchAccountTransactions(
  chainId: ChainId,
  address: EvmAddress,
  pagination: AccountHistoryPagination
): Promise<MoralisAccountTransaction[]> {
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

  const queryParams = new URLSearchParams({
    chain: moralisChainId,
    order: "DESC",
    include_internal_transactions: "false", // Moralis bug : doesn't work??
    nft_metadata: "false", // Moralis bug : doesn't work??
  });

  pagination.fromTimestamp && queryParams.set("from_date", pagination.fromTimestamp.toString());
  pagination.toTimestamp && queryParams.set("to_date", pagination.toTimestamp.toString());

  const url = `${explorerURL}/v2.2/wallets/${address}/history?${queryParams}`;

  const transactions = await fetchWithPagination<MoralisAccountTransaction>(chainId, url, "result");

  // FIXME Because the queryParams above don't work, need to filter unwanted transactions by hand
  // For now, we're not interested in internal transactions and NFTs
  return transactions.filter(
    (transaction) => !transaction.internal_transactions?.length && !transaction.nft_transfers?.length
  );
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
    senders: [
      {
        address: moralisTransaction.from_address,
      },
    ],
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
    parsedTransaction.recipients = [
      {
        amount: BigInt(moralisNativeTransfer.value),
        address: moralisNativeTransfer.to_address,
      },
    ];
  } else if (moralisTransaction.erc20_transfers?.length) {
    const moralisErc20Transfer = moralisTransaction.erc20_transfers[0];
    parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
    parsedTransaction.tokenId = moralisErc20Transfer.address;
    parsedTransaction.recipients = [
      {
        amount: BigInt(moralisErc20Transfer.value),
        address: moralisErc20Transfer.to_address,
      },
    ];
  }

  return parsedTransaction;
}

export {
  fetchAccountTransactions,
  fetchERC20Token,
  fetchERC20TokenAmounts,
  moralisToAdamikAccountTransaction,
};
