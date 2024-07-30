import { CHAINS } from "~/app/config/chains";
import { Xpub } from "../logic";
import { ChainId } from "~/app/model/types_WIP";
import { BLOCKCHAIR_API_KEY } from "~/app/config/apiKeys";
import { AddressesDashboardResponse, XpubDashboardResponse } from "./types";

const queryParams = new URLSearchParams({
  key: BLOCKCHAIR_API_KEY,
});

export async function fetchXpubData(chainId: ChainId, xpub: Xpub) {
  const explorerURL = CHAINS[chainId].backends.explorerURL;

  const url = `/dashboards/xpub/${xpub}?${queryParams.toString()}`;
  const response = await fetch(explorerURL + url).then((response) => response.json());
  const result = XpubDashboardResponse.safeParse(response);

  if (!result.success) {
    // FIXME: discuss standard way to handle errors within backends (tell the user or not? give default empty values or not?)
    throw new Error(
      `getXpubState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${
        result.error
      }`
    );
  }
  return result.data;
}

export async function fetchAddressesBalances(chainId: ChainId, addresses: string[]) {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  // FIXME: use POST instead of GET and put addresses in the body
  const url = `/dashboards/addresses/${addresses.join(",")}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url).then((res) => res.json());
  const result = AddressesDashboardResponse.safeParse(response);

  if (!result.success) {
    // FIXME: discuss standard way to handle errors within backends (tell the user or not? give default empty values or not?)
    throw new Error(
      `getAddressState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${
        result.error
      }`
    );
  }
  return result.data;
}

export async function pushTransaction(chainId: ChainId, signedTransaction: string): Promise<string> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;

  queryParams.set("data", signedTransaction);
  const url = `/push/transaction?${queryParams.toString()}`;

  const response = await fetch(`${explorerURL + url}`, {
    method: "POST",
  });

  const responseBody = await response.json();

  if (responseBody.context.code !== 200) {
    throw new Error(`broadcastTransaction - received invalid response: ${responseBody.context.error}`);
  }

  return responseBody.data.transaction_hash;
}

export async function fetchFeePerByte(chainId: ChainId): Promise<number> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;

  const url = `/stats?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

  // TODO: add zod validation
  const responseBody = await response.json();

  if (responseBody.context.code !== 200) {
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

  const responseBody = await response.json();

  if (responseBody.context.code !== 200) {
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

  const responseBody = await response.json();

  if (responseBody.context.code !== 200) {
    throw new Error(`fetchRawTxMetadata - received invalid response: ${responseBody.context.error}`);
  }

  return responseBody.data;
}

export function fetchAccountAddresses(pubKey: string) {}
