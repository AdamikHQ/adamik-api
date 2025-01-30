import { STARKSCAN_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import {
  TokenBalance,
  TokenBalancesResponse,
  TokenContract,
  TransactionHistoryResponse,
  TransactionResponse,
} from "./types";

const ROOT_URL = CHAINS.starknet.backends.explorerURL;

async function fetchTokenBalances(accountId: string): Promise<TokenBalance[]> {
  const url = `${ROOT_URL}/api/pro/v0/token-owned-by`;

  const params = new URLSearchParams({
    owner_address: accountId,
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": STARKSCAN_API_KEY,
    },
  });

  const data: TokenBalancesResponse = await response.json();

  return data.data;
}

async function fetchTokenContract(contractAddress: string): Promise<TokenContract> {
  const url = `${ROOT_URL}/api/pro/v0/token-contract/${contractAddress}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": STARKSCAN_API_KEY,
    },
  });

  const data: TokenContract = await response.json();

  return data;
}

async function fetchTransaction(transactionId: string) {
  const url = `${ROOT_URL}/api/v0/transaction/${transactionId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": STARKSCAN_API_KEY,
    },
  });

  const data: TransactionResponse = await response.json();

  return data;
}

async function fetchTransactionHistory(accountId: string, contractAddress: string) {
  const paramsFrom = new URLSearchParams({
    from_address: contractAddress,
    transfer_from_address: accountId,
  });
  const paramsTo = new URLSearchParams({
    from_address: contractAddress,
    transfer_to_address: accountId,
  });

  const urlFrom = `${ROOT_URL}/api/pro/v0/token-transfers?${paramsFrom.toString()}`;
  const urlTo = `${ROOT_URL}/api/pro/v0/token-transfers?${paramsTo.toString()}`;

  const responseFrom = await fetch(urlFrom, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": STARKSCAN_API_KEY,
    },
  });

  const responseTo = await fetch(urlTo, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": STARKSCAN_API_KEY,
    },
  });

  const dataFrom: TransactionHistoryResponse = await responseFrom.json();
  const dataTo: TransactionHistoryResponse = await responseTo.json();

  return { dataFrom, dataTo };
}

export { fetchTokenBalances, fetchTokenContract, fetchTransaction, fetchTransactionHistory };
