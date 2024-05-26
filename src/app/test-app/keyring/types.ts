import { ChainParams } from "../server-types";

type Reader = {
  getAddress({ accountNb, chainParams }: { accountNb?: number; chainParams?: ChainParams }): Promise<{
    publicKey: string;
    address: string;
  }>;
};

type Writer = {
  signTransaction({ accountNb, transaction }: { accountNb?: number; transaction: string }): Promise<{
    signature: null | Buffer;
    returnCode?: number | string;
  }>;
};

type Keyring = Reader & Writer & { getDefaultPath(): string };

export type { Keyring };
