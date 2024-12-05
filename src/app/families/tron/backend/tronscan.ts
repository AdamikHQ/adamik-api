import { TRONSCAN_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { TronscanAccountResponse, TronScanTransactionInfo } from "./types";

const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//FIXME: this is a temporary solution to handle the fetch failed error from tronscan
//TODO: remove this once tronscan is fixed
const isFetchFailedError = (error: any): boolean => {
  return error?.status?.errors?.[0]?.message === "fetch failed";
};

async function fetchTronscanAccountData(address: string, retryCount = 0): Promise<TronscanAccountResponse> {
  const apiUrl = `${CHAINS.tron.backends["explorerURL"]}/api/accountv2?address=${address}`;

  try {
    const response = await fetch(apiUrl, { headers: { "TRON-PRO-API-KEY": TRONSCAN_API_KEY } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: TronscanAccountResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Tronscan account data:", error);

    if (isFetchFailedError(error) && retryCount < MAX_RETRIES) {
      console.warn(`Retrying Tronscan API call (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
      await delay(RETRY_DELAY);
      return fetchTronscanAccountData(address, retryCount + 1);
    }

    throw error;
  }
}

async function fetchTronscanTransaction(transactionId: string): Promise<TronScanTransactionInfo> {
  const apiUrl = `${CHAINS.tron.backends["explorerURL"]}/api/transaction-info?hash=${transactionId}`;

  try {
    const response = await fetch(apiUrl, { headers: { "TRON-PRO-API-KEY": TRONSCAN_API_KEY } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: TronScanTransactionInfo = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Tronscan transaction data:", error);
    throw error;
  }
}

export { fetchTronscanAccountData, fetchTronscanTransaction };
