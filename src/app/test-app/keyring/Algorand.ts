import { Keyring } from "./types";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import LedgerApp from "@ledgerhq/hw-app-algorand";

const DEFAULT_PATH = "44'/283'/0'/0/0";

const AlgorandKeyring: Keyring = {
  async getAddress({ derivationPath = DEFAULT_PATH }) {
    const transport = await TransportWebUSB.create();
    const ledgerApp = new LedgerApp(transport);

    const { publicKey, address } = await ledgerApp.getAddress(derivationPath, false);

    return {
      publicKey,
      address,
    };
  },

  async signTransaction({ derivationPath = DEFAULT_PATH, transaction }) {
    const transport = await TransportWebUSB.create();
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
