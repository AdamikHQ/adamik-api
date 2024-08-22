import { BLOCKCHAIR_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";
import { Xpub } from "../types";
import {
  BlockchairAddressesResponse,
  BlockchairXpubResponse,
  TransactionBroadcastStatusSchema,
} from "./types";

const queryParams = new URLSearchParams({
  key: BLOCKCHAIR_API_KEY,
});

// FIXME: add correct fetch parsing + validation + error handling

export async function fetchXpubDashboard(chainId: ChainId, xpub: Xpub): Promise<BlockchairXpubResponse> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;

  const url = `/dashboards/xpub/${xpub}?${queryParams.toString()}`;
  const response = await fetch(explorerURL + url);

  if (response.status >= 500) {
    console.warn(`fetchXpubDashboard - received invalid response ${await response.text()}`);
    throw new Error(`fetchNetworkInformations - provider error: ${response.statusText}`);
  }
  const result = BlockchairXpubResponse.safeParse(await response.json());

  if (!result.success) {
    console.warn(`fetchXpubDashboard - received invalid response ${result.error}`);
    throw new Error(
      `fetchNetworkInformations - encoundetered an issue parsing provider's response: ${result.error}`
    );
  }

  if (result.data.context.code != 200) {
    console.warn(`fetchXpubDashboard - provider error: ${result.data.context.error}`);
    throw new Error(`fetchNetworkInformations - provider error: ${result.data.context.error}`);
  }
  return result.data;
}

export async function fetchAddressesDashboard(
  chainId: ChainId,
  addresses: string[]
): Promise<BlockchairAddressesResponse> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  // FIXME: use POST instead of GET and put addresses in the body
  const url = `/dashboards/addresses/${addresses.join(",")}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

  if (response.status >= 500) {
    console.warn(`getAddressState - received invalid response ${await response.text()}`);
    throw new Error(`fetchNetworkInformations - provider error: ${response.statusText}`);
  }

  const result = BlockchairAddressesResponse.safeParse(await response.json());

  if (!result.success) {
    console.warn(`getAddressState - received invalid response ${result.error}`);
    throw new Error(
      `fetchNetworkInformations - encoundetered an issue parsing provider's response: ${result.error}`
    );
  }

  if (result.data.context.code == 404) {
    return {
      context: result.data.context,
      data: null,
    };
  } else if (result.data.context.code != 200) {
    console.warn(`getAddressState - provider error: ${result.data.context.error}`);
    throw new Error(`fetchNetworkInformations - provider error: ${result.data.context.error}`);
  }
  return result.data;
}

export async function postTransaction(chaindId: ChainId, signedTransaction: string): Promise<string> {
  const explorerURL = CHAINS[chaindId].backends.explorerURL;

  queryParams.set("data", signedTransaction);
  const url = `/push/transaction?${queryParams.toString()}`;

  const response = await fetch(`${explorerURL + url}`, {
    method: "POST",
  });

  if (response.status >= 500) {
    console.warn(`fetchXpubDashboard - received invalid response ${await response.text()}`);
    throw new Error(`fetchNetworkInformations - provider error: ${response.statusText}`);
  }
  const result = TransactionBroadcastStatusSchema.safeParse(await response.json());

  if (!result.success) {
    console.warn(`fetchXpubDashboard - received invalid response ${result.error}`);
    throw new Error(
      `fetchNetworkInformations - encoundetered an issue parsing provider's response: ${result.error}`
    );
  }

  if (result.data.context.code != 200 || !result.data.data?.transaction_hash) {
    console.warn(`fetchXpubDashboard - provider error: ${result.data.context.error}`);
    throw new Error(`fetchNetworkInformations - provider error: ${result.data.context.error}`);
  }

  return result.data.data.transaction_hash;
}

export async function fetchFeePerByte(chainId: ChainId): Promise<number> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;

  const url = `/stats?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

  if (!response.ok) {
    console.warn(`fetchNetworkInformations - received invalid response ${response.text()}`);
    throw new Error(`Error while fetching ${chainId} from blockchair explorer`);
  }

  // TODO: add zod validation
  const responseBody = await response.json();

  if (responseBody.context.code !== 200) {
    console.warn(`fetchNetworkInformations - received invalid response ${JSON.stringify(responseBody)}`);
    throw new Error(`fetchNetworkInformations - received invalid response: ${responseBody.context.error}`);
  }

  return responseBody.data.suggested_transaction_fee_per_byte_sat;
}

export async function fetchTxMetadata(
  chainId: ChainId,
  txHash: string
): Promise<{
  [key: string]: {
    has_witness: boolean;
    outputs: [
      {
        index: number;
        script_hex: string;
        // ... other fields are not used for now
      }
    ];
    // ... other fields are not used for now
  };
}> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  const url = `/dashboards/transaction/${txHash}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

  if (!response.ok) {
    console.warn(`fetchTxMetadata - received invalid response ${response.text()}`);
    throw new Error(`Error while fetching ${chainId} from blockchair explorer`);
  }
  const responseBody = await response.json();

  if (responseBody.context.code !== 200) {
    console.warn(`fetchNetworkInformations - received invalid response ${JSON.stringify(responseBody)}`);
    throw new Error(`fetchRawTxMetadata - received invalid response: ${responseBody.context.error}`);
  }

  return responseBody.data;
}

export async function fetchRawTxMetadata(
  chainId: ChainId,
  txHash: string
): Promise<{
  [key: string]: {
    // key is tx_hash
    raw_transaction: string;
    /// ... other fields are not used for now
  };
}> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  const url = `/raw/transaction/${txHash}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

  if (!response.ok) {
    console.warn(`fetchRawTxMetadata - received invalid response ${response.text()}`);
    throw new Error(`Error while fetching ${chainId} from blockchair explorer`);
  }

  const responseBody = await response.json();

  if (responseBody.context.code !== 200) {
    console.warn(`fetchNetworkInformations - received invalid response ${JSON.stringify(responseBody)}`);
    throw new Error(`fetchRawTxMetadata - received invalid response: ${responseBody.context.error}`);
  }

  return responseBody.data;
}
