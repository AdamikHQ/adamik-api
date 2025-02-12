import { Contract, Provider, shortString } from "starknet";
import { STARKSCAN_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { SELECTOR_INDEX } from "../constants";
import {
  StarknetValidator,
  StarknetValidatorsResponse,
  TokenBalance,
  TokenBalancesResponse,
  TokenContract,
  TransactionHistory,
  TransactionHistoryResponse,
  TransactionResponse,
} from "./types";

const ROOT_URL = CHAINS.starknet.backends.explorerURL;

async function fetchWithHeaders(url: string, method: "GET" | "POST", body?: any) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": STARKSCAN_API_KEY,
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

async function fetchTokenBalances(
  accountId: string,
  paginationToken?: string
): Promise<{ balances: TokenBalance[]; nextPage: string | null }> {
  let url = `${ROOT_URL}/api/pro/v0/token-owned-by`;

  const params = new URLSearchParams({
    owner_address: accountId,
  });

  if (paginationToken) {
    const paginationData = paginationFromB64(paginationToken);
    if (paginationData && typeof paginationData === "string") {
      url = paginationData;
    }
  }

  const data: TokenBalancesResponse = await fetchWithHeaders(`${url}?${params.toString()}`, "GET");

  return {
    balances: data.data,
    nextPage: paginationToB64(data.next_url),
  };
}

async function fetchTokenContract(contractAddress: string): Promise<TokenContract> {
  const url = `${ROOT_URL}/api/pro/v0/token-contract/${contractAddress}`;

  const data: TokenContract = await fetchWithHeaders(url, "GET");

  return data;
}

const starkScanToAdamikTransaction = async (
  transaction: TransactionResponse
): Promise<FinalizedTransaction["parsed"]> => {
  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: transaction.transaction_hash,
    timestamp: transaction.timestamp,
    fees: {
      amount: BigInt(transaction.actual_fee),
    },
    mode: "unknown",
    state: TransactionState.UNKNOWN,
    nonce: BigInt(transaction.nonce ?? 0),
  };

  if (transaction.transaction_execution_status === "SUCCEEDED") {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = BigInt(transaction.block_number);
  }

  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  if (transaction.transaction_type === "DEPLOY_ACCOUNT") {
    parsedTransaction.mode = TransactionMode.DEPLOY_ACCOUNT;
    return parsedTransaction;
  }

  const classAt = await provider.getClassAt(transaction.account_calls[0].contract_address || "");
  const transactionSelector = transaction.account_calls[0].selector;

  if (SELECTOR_INDEX.find((selector) => selector.selector === transactionSelector)) {
    parsedTransaction.mode = TransactionMode.TRANSFER;

    const recipientAddress = transaction.account_calls[0].calldata[0];
    const amount = transaction.account_calls[0].calldata[1];

    const contract = new Contract(classAt.abi, transaction.account_calls[0].contract_address || "", provider);
    const symbol = await contract.functions.symbol();
    const ticker = shortString.decodeShortString(symbol);

    parsedTransaction.senders = [{ address: transaction.sender_address, amount: BigInt(amount), ticker }];
    parsedTransaction.recipients = [{ address: recipientAddress, amount: BigInt(amount), ticker }];
  }

  return parsedTransaction;
};

async function fetchTransaction(transactionId: string): Promise<FinalizedTransaction> {
  const url = `${ROOT_URL}/api/v0/transaction/${transactionId}`;

  const data: TransactionResponse = await fetchWithHeaders(url, "GET");

  const transaction = await starkScanToAdamikTransaction(data);

  return { parsed: transaction, raw: data };
}

async function getTransactionHistorySymbols(transactions: TransactionHistory[]) {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  const symbolsAddresses = Object.entries(
    transactions.reduce((acc, transaction) => {
      return { ...acc, [transaction.from_address]: transaction.from_address };
    }, {} as Record<string, string>)
  ).map(([symbolAddress]) => symbolAddress);

  const symbols = await Promise.all(
    symbolsAddresses.map(async (symbolAddress) => {
      const classAt = await provider.getClassAt(symbolAddress);

      const contract = new Contract(classAt.abi, symbolAddress || "", provider);
      const symbol = await contract.functions.symbol();

      return {
        symbolAddress,
        symbol: shortString.decodeShortString(symbol),
      };
    })
  );

  return symbols;
}

function starkScanToAdamikAccountTransaction(
  transactions: TransactionHistory[],
  symbols: { symbolAddress: string; symbol: string }[]
) {
  const adamikTransactions: FinalizedTransaction[] = transactions
    .map((transaction) => {
      if (transaction.invocation_type === "FUNCTION") {
        return {
          parsed: {
            id: transaction.transaction_hash,
            mode: TransactionMode.TRANSFER,
            state: TransactionState.CONFIRMED,
            blockHeight: BigInt(transaction.block_number),
            timestamp: transaction.timestamp,
            fees: {
              amount: BigInt(
                transactions.find(
                  (fee) =>
                    fee.transaction_hash === transaction.transaction_hash &&
                    fee.invocation_type === "FEE_TRANSFER"
                )?.transfer_amount ?? 0
              ),
              ticker: "STRK",
            },
            tokenId: transaction.from_address,
            recipients: [
              {
                address: transaction.transfer_from_address,
                amount: BigInt(transaction.transfer_amount),
                ticker: symbols.find((symbol) => symbol.symbolAddress === transaction.from_address)?.symbol,
              },
            ],
            senders: [
              {
                address: transaction.transfer_to_address,
                amount: BigInt(transaction.transfer_amount),
                ticker: symbols.find((symbol) => symbol.symbolAddress === transaction.from_address)?.symbol,
              },
            ],
          },
          raw: transaction,
        } as FinalizedTransaction;
      }
      return undefined;
    })
    .filter(Boolean) as FinalizedTransaction[]; // we clean all undefined values

  return adamikTransactions;
}

async function fetchTransactionHistory(
  accountId: string,
  paginationToken?: string
): Promise<{ transactions: FinalizedTransaction[]; nextPage: string | null }> {
  let dataFrom: TransactionHistoryResponse | undefined;
  let dataTo: TransactionHistoryResponse | undefined;

  if (paginationToken) {
    const paginationData = paginationFromB64(paginationToken) as {
      nextPageFromUrl?: string;
      nextPageToUrl?: string;
    };

    if (paginationData.nextPageFromUrl) {
      dataFrom = await fetchWithHeaders(paginationData.nextPageFromUrl, "GET");
    }

    if (paginationData.nextPageToUrl) {
      dataTo = await fetchWithHeaders(paginationData.nextPageToUrl, "GET");
    }
  } else {
    const paramsFrom = new URLSearchParams({
      transfer_from_address: accountId,
    });
    const paramsTo = new URLSearchParams({
      transfer_to_address: accountId,
    });

    const urlFrom = `${ROOT_URL}/api/pro/v0/token-transfers?${paramsFrom.toString()}`;
    const urlTo = `${ROOT_URL}/api/pro/v0/token-transfers?${paramsTo.toString()}`;

    dataFrom = await fetchWithHeaders(urlFrom, "GET");
    dataTo = await fetchWithHeaders(urlTo, "GET");
  }

  let nextPage = {};

  if (dataFrom?.next_url) {
    nextPage = { ...nextPage, nextPageFromUrl: dataFrom.next_url };
  }
  if (dataTo?.next_url) {
    nextPage = { ...nextPage, nextPageToUrl: dataTo.next_url };
  }

  const combinedData = [...(dataFrom?.data ?? []), ...(dataTo?.data ?? [])];
  const symbols = await getTransactionHistorySymbols(combinedData);

  const adamikTransactions = starkScanToAdamikAccountTransaction(combinedData, symbols);

  return {
    transactions: adamikTransactions,
    nextPage: paginationToB64(Object.keys(nextPage).length > 0 ? nextPage : null),
  };
}

const fetchValidators = async (
  paginationToken?: string
): Promise<{ validators: StarknetValidator[]; nextPage: string | null }> => {
  let data: StarknetValidatorsResponse | undefined;

  const paginationData = paginationFromB64(paginationToken);
  if (paginationData) {
    if (typeof paginationData === "string") {
      data = await fetchWithHeaders(paginationData, "GET");
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  } else {
    const url = `${ROOT_URL}/api/pro/v0/staking-stakers`;
    data = await fetchWithHeaders(url, "GET");
  }

  if (!data) {
    throw new ThirdPartyProviderError("Error while fetching validators from the indexer");
  }

  return {
    validators: data.data,
    nextPage: paginationToB64(data.next_url),
  };
};

export {
  fetchTokenBalances,
  fetchTokenContract,
  fetchTransaction,
  fetchTransactionHistory,
  fetchValidators,
  starkScanToAdamikTransaction,
};
