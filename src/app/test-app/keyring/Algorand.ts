import { Keyring } from "./types";
import LedgerApp from "@ledgerhq/hw-app-algorand";
import { getTransport } from "../shared";

const DERIVATION_PATH = (accountNb: number) => `44'/283'/${accountNb}'/0/0`;

const AlgorandKeyring: Keyring = {
  async getAddress({ accountNb = 0 }: { accountNb: number }) {
    const transport = await getTransport();
    const ledgerApp = new LedgerApp(transport);
    const derivationPath = DERIVATION_PATH(accountNb);

    const { publicKey, address } = await ledgerApp.getAddress(derivationPath, false);

    return {
      publicKey,
      address,
    };
  },

  async signTransaction({ accountNb = 0, transaction }: { accountNb: number; transaction: string }) {
    const transport = await getTransport();
    const ledgerApp = new LedgerApp(transport);
    const derivationPath = DERIVATION_PATH(accountNb);

    const { signature } = await ledgerApp.sign(derivationPath, transaction);

    return {
      signature,
    };
  },

  getDefaultPath() {
    return DERIVATION_PATH(0);
  },
};

export { AlgorandKeyring };
