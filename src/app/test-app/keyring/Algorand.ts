import { Keyring } from "./types";
import LedgerApp from "@ledgerhq/hw-app-algorand";
import { getTransport } from "../shared";

const DEFAULT_PATH = "44'/283'/0'/0/0";

const AlgorandKeyring: Keyring = {
  async getAddress({ derivationPath = DEFAULT_PATH }) {
    const transport = await getTransport();
    const ledgerApp = new LedgerApp(transport);

    const { publicKey, address } = await ledgerApp.getAddress(derivationPath, false);

    return {
      publicKey,
      address,
    };
  },

  async signTransaction({ derivationPath = DEFAULT_PATH, transaction }) {
    const transport = await getTransport();
    const ledgerApp = new LedgerApp(transport);

    const { signature } = await ledgerApp.sign(derivationPath, transaction);

    return {
      signature,
    };
  },

  getDefaultPath() {
    return DEFAULT_PATH;
  },
};

export { AlgorandKeyring };
