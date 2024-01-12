import { Keyring } from "./types";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import LedgerNanoApp from "@ledgerhq/hw-app-cosmos";
import { CosmosApp as ZondaxNanoApp } from "@zondax/ledger-cosmos-js";
import { serializeSignDoc } from "@cosmjs/amino";

const DEFAULT_PATH = "44'/118'/0'/0/0";

const CosmosKeyring: Keyring = {
  async getAddress({ path = DEFAULT_PATH, chainPrefix }: { path: string; chainPrefix: string }) {
    const transport = await TransportWebUSB.create();
    const ledgerNanoApp = new LedgerNanoApp(transport);

    const { publicKey, address } = await ledgerNanoApp.getAddress(path, chainPrefix);

    return {
      publicKey,
      address,
    };
  },

  async sign({ path = DEFAULT_PATH, message }) {
    const transport = await TransportWebUSB.create();
    const ledgerNanoApp = new ZondaxNanoApp(transport);

    const pathNodes = path.split("/").map((p) => parseInt(p.replace("'", "")));
    const messageBuffer = Buffer.from(serializeSignDoc(JSON.parse(message)));
    const { signature } = await ledgerNanoApp.sign(pathNodes, messageBuffer);

    return {
      signature,
    };
  },
};

export { CosmosKeyring };
