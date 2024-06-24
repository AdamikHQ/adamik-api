import { AddressState, TokenAmount } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { CHAINS } from "~/app/config/chains";
import { addressBalancesDataSchema } from "../backend/types";

async function getAddressState(this: BtcService, address: string): Promise<AddressState> {
  const explorerURL = CHAINS[this.chainId].backends.explorerURL;
  const url = `/addresses/balances?addresses=${address}`;

  const response = await fetch(explorerURL + url).then((response) => response.json());
  const result = addressBalancesDataSchema([address]).safeParse(response);

  if (!result.success) {
    console.info(`getAddressState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${result.error}`);
  }

  return {
    chainId: this.chainId,
    address,
    balances: {
      native: {
        available: result.success ? result.data.data[address] ?? 0n : 0n,
      },
    },
  };
}

export { getAddressState };
