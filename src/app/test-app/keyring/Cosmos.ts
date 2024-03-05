import { Keyring } from "./types";
import { CosmosApp as LedgerApp } from "@zondax/ledger-cosmos-js";
import { getTransport } from "../shared";

const DEFAULT_PATH = "44'/118'/0'/0/0";

const getPathNodes = (path: string): number[] => path.split("/").map((p) => parseInt(p.replace("'", "")));

const CosmosKeyring: Keyring = {
  async getAddress({
    derivationPath = DEFAULT_PATH,
    chainPrefix,
  }: {
    derivationPath: string;
    chainPrefix: string;
  }) {
    const transport = await getTransport();
    const ledgerApp = new LedgerApp(transport);

    const pathNodes = getPathNodes(derivationPath);
    const { compressed_pk: publicKey, bech32_address: address } = await ledgerApp.getAddressAndPubKey(
      pathNodes,
      chainPrefix,
      false
    );

    return {
      publicKey,
      address,
    };
  },

  async signTransaction({ derivationPath = DEFAULT_PATH, transaction }) {
    const transport = await getTransport();
    const ledgerApp = new LedgerApp(transport);

    const pathNodes = getPathNodes(derivationPath);
    const messageBuffer = Buffer.from(transaction, "hex");
    const { signature } = await ledgerApp.sign(pathNodes, messageBuffer);

    return {
      signature,
    };
  },

  getDefaultPath() {
    return DEFAULT_PATH;
  },
};

export { CosmosKeyring };
