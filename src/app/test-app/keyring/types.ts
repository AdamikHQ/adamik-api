type Reader = {
  getAddress({ derivationPath, chainPrefix }: { derivationPath?: string; chainPrefix?: string }): Promise<{
    publicKey: string;
    address: string;
  }>;
};

type Writer = {
  signTransaction({
    derivationPath,
    transaction,
  }: {
    derivationPath?: string;
    transaction: string;
  }): Promise<{
    signature: null | Buffer;
    returnCode?: number | string;
  }>;
};

type Keyring = Reader & Writer;

export type { Keyring };
