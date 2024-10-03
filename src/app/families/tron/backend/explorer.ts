import { TRONSCAN_API_KEY } from "~/app/config/apiKeys";

interface TronscanAccountResponse {
  address: string;
  balance: number;
  totalFrozenV2: number;
  transactions_out: number;
  transactions_in: number;
  totalTransactionCount: number;
  accountType: number;
  name: string;
  energyCost: number;
  netCost: number;
  bandwidth: {
    energyRemaining: number;
    totalEnergyLimit: number;
    totalEnergyWeight: number;
    netUsed: number;
    freeNetLimit: number;
    freeNetRemaining: number;
  };
  withPriceTokens: Array<{
    amount: string;
    tokenPriceInTrx: number;
    tokenId: string;
    balance: string;
    tokenName: string;
    tokenDecimal: number;
    tokenAbbr: string;
    tokenCanShow: number;
    tokenType: string;
    vip: boolean;
    tokenLogo: string;
  }>;
}

async function fetchTronscanAccountData(address: string): Promise<TronscanAccountResponse> {
  const apiUrl = `https://apilist.tronscanapi.com/api/accountv2?address=${address}`;

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

export { fetchTronscanAccountData };
