import { BLOCKCHAIR_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";
import { Xpub } from "../types";
import {
  BlockchairAddressesResponse,
  TransactionBroadcastStatusSchema,
  BlockchairXpubResponse,
} from "./types";

const queryParams = new URLSearchParams({
  key: BLOCKCHAIR_API_KEY,
});

export async function fetchXpubDashboard(chainId: ChainId, xpub: Xpub) {
  const explorerURL = CHAINS[chainId].backends.explorerURL;

  const url = `/dashboards/xpub/${xpub}?${queryParams.toString()}`;
  const response = await fetch(explorerURL + url).then((response) => response.json());
  const result = BlockchairXpubResponse.safeParse(response);

  if (!result.success || result.data.context.code != 200) {
    console.warn(
      `getXpubState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${
        result.error
      }`
    );
    throw new Error(`Error while fetching ${chainId} xpub dashboard from blockchair explorer`);
  }
  return result.data;
}

export async function fetchAddressesDashboard(chainId: ChainId, addresses: string[]) {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  // FIXME: use POST instead of GET and put addresses in the body
  const url = `/dashboards/addresses/${addresses.join(",")}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url).then((res) => res.json());
  const result = BlockchairAddressesResponse.safeParse(response);

  if (!result.success || result.data.context.code != 200) {
    // FIXME: discuss standard way to handle errors within backends (tell the user or not? give default empty values or not?)
    console.warn(
      `getAddressState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${
        result.error
      }`
    );
    throw new Error(`Error while fetching ${chainId} addresses dashboard from blockchair explorer`);
  }
  return result.data;
}

export async function postTransaction(chaindId: ChainId, signedTransaction: string) {
  const explorerURL = CHAINS[chaindId].backends.explorerURL;

  queryParams.set("data", signedTransaction);
  const url = `/push/transaction?${queryParams.toString()}`;

  const response = await fetch(`${explorerURL + url}`, {
    method: "POST",
  }).then((res) => res.json());

  const result = TransactionBroadcastStatusSchema.safeParse(response);

  if (!result.success || !result.data.data || result.data.context.code != 200) {
    console.warn(`broadcastTransaction - received invalid response: ${result.error}`);
    throw new Error(`Error while broadcasting transaction on ${chaindId} from blockchair explorer`);
  }

  return result.data.data.transaction_hash;
}
