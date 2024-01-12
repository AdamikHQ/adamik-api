import { Keyring } from "./types";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import NanoApp from "@ledgerhq/hw-app-algorand";

const DEFAULT_PATH = "44'/283'/0'/0/0";

const AlgorandKeyring: Keyring = {
  async getAddress({ path = DEFAULT_PATH }) {
    const transport = await TransportWebUSB.create();
    const ledgerNanoApp = new NanoApp(transport);

    const { publicKey, address } = await ledgerNanoApp.getAddress(path, false);

    return {
      publicKey,
      address,
    };
  },

  async sign({ path = DEFAULT_PATH, message }) {
    const transport = await TransportWebUSB.create();
    const ledgerNanoApp = new NanoApp(transport);

    const { signature } = await ledgerNanoApp.sign(path, message);

    return {
      signature,
    };
  },
};

export { AlgorandKeyring };
