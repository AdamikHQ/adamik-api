type Reader = {
  getAddress({ path, chainPrefix }: { path?: string; chainPrefix?: string }): Promise<{
    publicKey: string;
    address: string;
  }>;
};

type Writer = {
  sign({ path, message }: { path?: string; message: string }): Promise<{
    signature: null | Buffer;
    returnCode?: number | string;
  }>;
};

type Keyring = Reader & Writer;

export type { Keyring };
