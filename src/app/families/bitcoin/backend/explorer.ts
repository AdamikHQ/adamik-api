import { CHAINS } from "~/app/config/chains";

const API_URL = CHAINS.bitcoin.backends.explorerURL;

// TODO: add auth key once available
const AUTH_HEADER = {
};

export function fetchAddressesBalances(addresses: string[]) {
    return fetch(`${API_URL}/addresses/balances`, {
        headers: AUTH_HEADER,
        method: "POST",
        body: JSON.stringify({
            addresses,
        }),
    }).then(async (response) => {
        if (response.status === 200) {
            return await response.json();
        } else {
            console.error("fetchAddressesBalances - backend error:", response.statusText);
        }
    });
}