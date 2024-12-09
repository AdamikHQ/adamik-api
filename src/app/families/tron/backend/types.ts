type TronscanAccountInfo = {
  address: string;
  balance: number;
  totalFrozenV2: number;
  transactions_out: number;
  transactions_in: number;
  totalTransactionCount: number;
  accountType: number;
  name: string;
  energyCost: number;
  netCost: number;
  bandwidth: {
    energyRemaining: number;
    totalEnergyLimit: number;
    totalEnergyWeight: number;
    netUsed: number;
    freeNetLimit: number;
    freeNetRemaining: number;
  };
  withPriceTokens: Array<{
    amount: string;
    tokenPriceInTrx: number;
    tokenId: string;
    balance: string;
    tokenName: string;
    tokenDecimal: number;
    tokenAbbr: string;
    tokenCanShow: number;
    tokenType: string;
    vip: boolean;
    tokenLogo: string;
  }>;
};

type TronscanTransactionInfo = {
  contract_map: {
    [address: string]: boolean;
  };
  contractRet: string;
  data: string;
  contractInfo: {
    [contractAddress: string]: {
      isToken: boolean;
      tag1: string;
      tag1Url: string;
      name: string;
      risk: boolean;
      vip: boolean;
    };
  };
  contractType: number;
  toAddress: string;
  confirmed: boolean;
  block: number;
  riskTransaction: boolean;
  timestamp: number;
  info: unknown;
  normalAddressInfo: {
    [address: string]: {
      risk: boolean;
    };
  };
  cost: {
    net_fee_cost: number;
    fee: number;
    energy_fee_cost: number;
    net_usage: number;
    multi_sign_fee: number;
    net_fee: number;
    energy_penalty_total: number;
    energy_usage: number;
    energy_fee: number;
    energy_usage_total: number;
    memoFee: number;
    origin_energy_usage: number;
    account_create_fee?: number;
    date_created?: number;
  };
  noteLevel: number;
  addressTag: Record<string, unknown>;
  revert: boolean;
  confirmations: number;
  trigger_info: {
    method: string;
    parameter: {
      _value: string;
      _to: string;
    };
    methodId: string;
    contract_address: string;
    call_value: number;
  };
  signature_addresses: string[];
  ownerAddress: string;
  srConfirmList: Array<{
    address: string;
    name: string;
    block: number;
    url: string;
  }>;
  hash: string;
  contractData: {
    amount?: number;
    asset_name?: string;
    owner_address: string;
    to_address?: string;
    tokenInfo?: {
      tokenLevel: string;
      tokenId: string;
      tokenName: string;
      tokenDecimal: number;
      tokenAbbr: string;
      tokenCanShow: number;
      tokenType: string;
      vip: boolean;
      tokenLogo: string;
    };
    data?: string;
    contract_address?: string;
  };
  event_count?: number;
  project?: string;
  trc20TransferInfo?: Array<{
    icon_url: string;
    symbol: string;
    level: string;
    to_address: string;
    contract_address: string;
    type: string;
    decimals: number;
    name: string;
    vip: boolean;
    tokenType: string;
    from_address: string;
    amount_str: string;
    status: number;
  }>;
  transfersAllList?: Array<{
    icon_url: string;
    symbol: string;
    level: string;
    to_address: string;
    contract_address: string;
    type: string;
    decimals: number;
    name: string;
    vip: boolean;
    tokenType: string;
    from_address: string;
    amount_str: string;
    status: number;
  }>;
  triggerContractType?: number;
  fee_limit?: number;
  tokenTransferInfo?: {
    icon_url: string;
    symbol: string;
    level: string;
    to_address: string;
    contract_address: string;
    type: string;
    decimals: number;
    name: string;
    vip: boolean;
    tokenType: string;
    from_address: string;
    amount_str: string;
    status: number;
  };
  contract_type?: string;
};

interface TronscanAccountTokensInfo {
  total: number;
  data: Array<{
    amount?: string;
    quantity: number | string;
    tokenId: string;
    tokenPriceInUsd?: number;
    tokenName: string;
    tokenAbbr: string;
    tokenCanShow: number;
    tokenLogo: string;
    tokenPriceInTrx?: number;
    amountInUsd?: number;
    balance: string;
    tokenDecimal: number;
    tokenType: string;
    vip: boolean;
    owner_address?: string;
    transferCount?: number;
    nrOfTokenHolders?: number;
    project?: string;
  }>;
  contractMap: Record<string, boolean>;
  contractInfo: Record<
    string,
    {
      tag1: string;
      tag1Url: string;
      name: string;
      vip: boolean;
    }
  >;
}

export type { TronscanAccountInfo, TronscanAccountTokensInfo, TronscanTransactionInfo };
