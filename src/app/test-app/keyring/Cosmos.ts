import { Keyring } from "./types";
import { CosmosApp as LedgerApp } from "@zondax/ledger-cosmos-js";
import { CosmosParams, getTransport } from "../shared";

const DERIVATION_PATH = (accountNb: number) => `44'/118'/${accountNb}'/0/0`;

const splitPathNodes = (path: string): number[] => path.split("/").map((p) => parseInt(p.replace("'", "")));

const CosmosKeyring: Keyring = {
  async getAddress({ accountNb = 0, chainParams }: { accountNb: number; chainParams?: CosmosParams }) {
    if (!chainParams?.prefix) {
      throw new Error("Invalid CosmosParams provided to getAddress");
    }

    const transport = await getTransport();
    const ledgerApp = new LedgerApp(transport);
    const derivationPath = DERIVATION_PATH(accountNb);

    const pathNodes = splitPathNodes(derivationPath);
    const { compressed_pk: publicKey, bech32_address: address } = await ledgerApp.getAddressAndPubKey(
      pathNodes,
      chainParams.prefix,
      false
    );

    return {
      publicKey,
      address,
    };
  },

  async signTransaction({ accountNb = 0, transaction }: { accountNb: number; transaction: string }) {
    const transport = await getTransport();
    const ledgerApp = new LedgerApp(transport);
    const derivationPath = DERIVATION_PATH(accountNb);

    const pathNodes = splitPathNodes(derivationPath);
    const messageBuffer = Buffer.from(transaction, "hex");
    const { signature } = await ledgerApp.sign(pathNodes, messageBuffer);

    return {
      signature,
    };
  },

  getDefaultPath() {
    return DERIVATION_PATH(0);
  },
};

export { CosmosKeyring };
