type HeliusTokenFile = {
  uri: string;
  cdn_uri: string;
  mime: string;
};

type HeliusTokenMetadata = {
  description: string;
  name: string;
  symbol: string;
  token_standard: string;
};

type HeliusTokenContent = {
  $schema: string;
  json_uri: string;
  files: HeliusTokenFile[];
  metadata: HeliusTokenMetadata;
  links?: Record<string, string>;
};

type HeliusAssetResponse = {
  jsonrpc: string;
  result: HeliusToken;
};

type HeliusToken = {
  interface: "V1_NFT" | "FungibleToken";
  type: string;
  id: string;
  content: HeliusTokenContent;
  authorities: Array<{
    address: string;
    scopes: string[];
  }>;
  compression: {
    eligible: boolean;
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    asset_hash: string;
    tree: string;
    seq: number;
    leaf_id: number;
  };
  grouping: Array<{
    group_key: string;
    group_value: string;
  }>;
  royalty: {
    royalty_model: string;
    target: string | null;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  creators: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate: string | null;
    ownership_model: string;
    owner: string;
  };
  supply: {
    print_max_supply: number;
    print_current_supply: number;
    edition_nonce: number | null;
  } | null;
  mutable: boolean;
  burnt: boolean;
  token_info: {
    symbol: string;
    name: string;
    decimals: number;
    supply: number;
    token_program: string;
    associated_token_address: string;
    balance: number;
    price_info?: {
      price_per_token: number;
      currency: string;
    };
    mint_authority?: string;
    freeze_authority?: string;
  };
};

type HeliusTokensResponse = {
  jsonrpc: string;
  result: {
    total: number;
    limit: number;
    page: number;
    items: HeliusToken[];
  };
};

type TokenTransfer = {
  fromTokenAccount: string;
  toTokenAccount: string;
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  mint: string;
  tokenStandard: "Fungible" | string;
};

type NativeTransfer = {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
};

type RawTokenAmount = {
  tokenAmount: string;
  decimals: number;
};

type TokenBalanceChange = {
  userAccount: string;
  tokenAccount: string;
  rawTokenAmount: RawTokenAmount;
  mint: string;
};

type AccountData = {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
};

type Instruction = {
  accounts: string[];
  data: string;
  programId: string;
  innerInstructions: Instruction[];
};

type HeliusTransactionResponse = {
  description: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  signature: string;
  slot: number;
  timestamp: number;
  tokenTransfers: TokenTransfer[];
  nativeTransfers: NativeTransfer[];
  accountData: AccountData[];
  transactionError: null | unknown;
  instructions: Instruction[];
  events: Record<string, unknown>;
};

export type {
  HeliusAssetResponse,
  HeliusToken,
  HeliusTokenContent,
  HeliusTokenFile,
  HeliusTokenMetadata,
  HeliusTokensResponse,
  HeliusTransactionResponse,
};
