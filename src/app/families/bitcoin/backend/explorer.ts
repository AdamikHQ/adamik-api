import { CHAINS } from "~/app/config/chains";
import { Xpub } from "../logic";
import { ChainId } from "~/app/model/types_WIP";
import { BLOCKCHAIR_API_KEY } from "~/app/config/apiKeys";
import { AddressesDashboardResponse, XpubDashboardResponse } from "./types";

const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
});

export async function fetchXpubBalances(chainId: ChainId, xpub: Xpub) {
    const explorerURL = CHAINS[chainId].backends.explorerURL;

    const url = `/dashboards/xpub/${xpub}?${queryParams.toString()}`;
    const response = await fetch(explorerURL + url).then((response) => response.json());
    const result = XpubDashboardResponse.safeParse(response);

    if (!result.success) {
        // FIXME: discuss standard way to handle errors within backends (tell the user or not? give default empty values or not?)
        throw new Error(`getXpubState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${result.error}`);
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
        throw new Error(`getAddressState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${result.error}`);
    }
    return result.data;
}



export function fetchAccountAddresses(pubKey: string) {

}
