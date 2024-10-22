import { TRONSCAN_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { TronscanAccountResponse, TronScanTransactionInfo } from "./types";

async function fetchTronscanAccountData(address: string): Promise<TronscanAccountResponse> {
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
