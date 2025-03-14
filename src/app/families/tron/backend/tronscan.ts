import { TRONSCAN_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { TronscanAccountInfo, TronscanAccountTokensInfo, TronscanTransactionInfo } from "./types";
import { Provider, ProviderType } from "~/app/model/types_WIP";

const TRONSCAN_PAGE_SIZE = 20;

const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const explorerURL = CHAINS.tron.backends.find((p: Provider) => p.type === ProviderType.tronscan)?.url;
//FIXME: this is a temporary solution to handle the fetch failed error from tronscan
//TODO: remove this once tronscan is fixed
async function fetchWithRetry<T>(url: string, retryCount = 0): Promise<T> {
  try {
    const response = await fetch(url, { headers: { "TRON-PRO-API-KEY": TRONSCAN_API_KEY } });

    if (response?.ok) {
      return await response.json();
    }

    if (retryCount < MAX_RETRIES) {
      console.warn(`Retrying Tronscan API call (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
      await delay(RETRY_DELAY);
      return await fetchWithRetry(url, retryCount + 1);
    } else {
      console.warn(`/!\\ Invalid response from tron explorer endpoint: ${url.toString()}:`, response);
      throw new ThirdPartyProviderError("Invalid response received from tron explorer");
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Retrying Tronscan API call (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
      await delay(RETRY_DELAY);
      return await fetchWithRetry(url, retryCount + 1);
    } else {
      console.warn(`/!\\ Error received from tron explorer endpoint: ${url.toString()}:`, error);
      throw new ThirdPartyProviderError("Error received from tron explorer");
    }
  }
}

async function fetchTransaction(transactionId: string): Promise<TronscanTransactionInfo> {
  const url = `${explorerURL}/api/transaction-info?hash=${transactionId}`;

  return await fetchWithRetry<TronscanTransactionInfo>(url);
}

async function fetchAccountData(address: string): Promise<TronscanAccountInfo> {
  const url = `${explorerURL}/api/accountv2?address=${address}`;

  return await fetchWithRetry<TronscanAccountInfo>(url);
}

// TODO Test this
async function fetchAccountTokensData(
  address: string,
  paginationToken?: string
): Promise<{ tokensInfo: TronscanAccountTokensInfo; nextPage: string | null }> {
  let startParam = "0"; // Updated below using paginationToken if available

  const searchParams = new URLSearchParams({
    address: address,
    limit: TRONSCAN_PAGE_SIZE.toString(),
  });

  const paginationData = paginationFromB64(paginationToken);
  if (paginationData) {
    if (typeof paginationData === "string") {
      startParam = paginationData;
      searchParams.set("start", startParam);
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const url = `${explorerURL}/api/account/tokens?${searchParams}`;

  const tokensInfo = await fetchWithRetry<TronscanAccountTokensInfo>(url);

  const nextPage =
    tokensInfo?.data.length < TRONSCAN_PAGE_SIZE
      ? null
      : paginationToB64((Number(startParam) + TRONSCAN_PAGE_SIZE).toFixed());

  return {
    tokensInfo,
    nextPage,
  };
}

export { fetchAccountData, fetchAccountTokensData, fetchTransaction };
