import { BabylonCreateBTCDelegationMessage } from "~/app/families/babylon/types";

/*
{
    "txhash": "9C96915060C952D4D3ACF7A0621287AA9FF26D044DC5B7E150152A30D7F41DDB",
    "height": "21965173",
    "timestamp": "2024-08-30T16:13:25Z",
    "codespace": "",
    "code": 0,
    "data": "12E1060A3F2F636F736D6F732E646973747269627574696F6E2E763162657461312E4D7367576974686472617744656C656761746F72526577617264526573706F6E7365129D060A4A0A446962632F30303235463841383734363441343731453636423233344334463933414543354234444133443432443739383634353141303539323733343236323930444435120231300A4A0A446962632F30353438393244364242343341463842393341414332384141354644373031394432433539413135444146443646343543314641324246394244413232343534120234380A4B0A446962632F3642384133463543324144353143443631373146413431413745384333354144353934414236393232363433384442393434353034333645413537423341383912033137320A4A0A446962632F37313542443633344346344439313443334545393342304638413944323531344237343346364645333642433830323633443142433545453442334335443430120239320A490A446962632F383844434141343341394344303939453146394242423830423941393046363437383245424131313541383442324344383339383735374144413446344234301201390A530A446962632F42303131433141304144354537313746363734424135394644384530354232463934364534464434314339434233333131433935463745443442383135363230120B37383135373232353035390A4A0A446962632F42303535333942363642373245323733394239383642383633393145354430384631324238443544324332413746384638434639414446363734444641323331120231320A560A446962632F42333841414130463741334543344437433845313244464133334646393332303546453741343237333841344230353930453246463135424336304136313242120E31303737323938353931343734330A4B0A446962632F4434314543433846454631423745394334424343353842313336323538383432303835334139443042383938454444353133443942373941464641313935433812033130340A490A446962632F453932453037453638373035464144313333303545453943373336383442333041374236364135324635344339383930333237453041344330463144323245331201350A0E0A057561746F6D12053834303437",
    "raw_log": "",
    "logs": [],
    "info": "",
    "gas_wanted": "856806",
    "gas_used": "630193",
    "tx": {
      "@type": "/cosmos.tx.v1beta1.Tx",
      "body": {
        "messages": [
          {
            "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
            "delegator_address": "cosmos1wvvmjg54sn0a3nuw7rh0g9k2z3s3fdhhdx7c3p",
            "validator_address": "cosmosvaloper1hmd535f69t3x262m6s9wc6jd0dmel2zevhyuhm"
          }
        ],
        "memo": "",
        "timeout_height": "0",
        "extension_options": [],
        "non_critical_extension_options": []
      },
      "auth_info": {
        "signer_infos": [
          {
            "public_key": {
              "@type": "/cosmos.crypto.secp256k1.PubKey",
              "key": "A99r9rWqTUKm/XlmmGZa/MkqSJ2mSr6sVOop+TaJ45cg"
            },
            "mode_info": {
              "single": {
                "mode": "SIGN_MODE_LEGACY_AMINO_JSON"
              }
            },
            "sequence": "76"
          }
        ],
        "fee": {
          "amount": [
            {
              "denom": "uatom",
              "amount": "5141"
            }
          ],
          "gas_limit": "856806",
          "payer": "",
          "granter": ""
        },
        "tip": null
      },
      "signatures": [
        "QndMQVcZMSt7MWpMj1oFi6HjtqBek/ja0lV0wIIuMlEwUSbcnDBetFH49CzepZEYm0dhfuege8f7zE5tsD5NIw=="
      ]
    },
    "events": [...]
  }
}
*/
type CosmosTransaction = {
  code: number;
  txhash: string;
  height: string;
  timestamp: string;
  gas_used: string;
  gas_wanted: string;
  data: string;
  tx: {
    "@type": string;
    body: {
      messages: ({ "@type": string } & any)[];
      memo: string;
    };
    auth_info: {
      signer_infos: {
        sequence: string;
      }[];
      fee: {
        amount: {
          denom: string;
          amount: string;
        }[];
      };
    };
  };
  events: {
    type: string;
    attributes: {
      key: string;
      value: string;
      index: boolean;
    }[];
  }[];
};

type CosmosAccount = {
  accountNumber: bigint;
  sequence: bigint;
  pubKeyType: string;
  pubKey: string;
};

type CosmosBalance = {
  denom: string;
  amount: string;
};

type CosmosDelegation = {
  balance: CosmosBalance;
  delegation: {
    delegator_address: string;
    validator_address: string;
    shares: number;
  };
};

type CosmosRedelegation = {
  redelegation: {
    delegator_address: string;
    validator_src_address: string;
    validator_dst_address: string;
    entries:
      | {
          creation_height: string;
          completion_time: string;
          initial_balance: string;
          shares_dst: string;
        }[]
      // null since sdk 0.46
      | null;
  };
  entries: {
    redelegation_entry: {
      creation_height: string;
      completion_time: string;
      initial_balance: string;
      shares_dst: string;
      // only since sdk 0.46
      unbonding_id?: string;
    };
    balance: string;
  }[];
};

type CosmosUnbondingDelegation = {
  delegator_address: string;
  validator_address: string;
  entries: {
    creation_height: string;
    completion_time: string;
    initial_balance: string;
    balance: string;
    unbonding_id: string;
    unbonding_on_hold_ref_count: string;
  }[];
};

type CosmosReward = {
  validator_address: string;
  reward: CosmosBalance[];
};

type CosmosRewards = {
  rewards: CosmosReward[];
  total: CosmosBalance[];
};

type COSMOS_STAKING_STATUS =
  | "BOND_STATUS_UNSPECIFIED"
  | "BOND_STATUS_UNBONDED"
  | "BOND_STATUS_UNBONDING"
  | "BOND_STATUS_BONDED";

type CosmosValidator = {
  operator_address: string;
  consensus_pubkey: string;
  jailed: boolean;
  status: COSMOS_STAKING_STATUS;
  tokens: string;
  delegator_shares: string;
  description: {
    moniker: string; //human-readable name for the validator
    identity: string;
    website: string;
    security_contact: string; // security_contact defines an optional email for security contact.
    details: string;
  };
  unbonding_height: string; // unbonding_height defines, if unbonding, the height at which this validator has begun unbonding.
  unbonding_time: string; // unbonding_time defines, if unbonding, the min time for the validator to complete unbonding.
  commission: {
    commission_rates: {
      rate: string;
      max_rate: string;
      max_change_rate: string;
    };
    update_time: string;
  };
  min_self_delegation: string;
};

// MINTSCAN ///////////

type MintscanAccountTransactionsResponse = {
  transactions: MintscanTransaction[];
  pagination: Pagination;
};

type Pagination = {
  totalCount: number;
  searchAfter: string;
};

type MintscanTransaction = {
  height: string;
  txhash: string;
  codespace: string;
  code: number;
  data: string;
  info: string;
  gas_wanted: string;
  gas_used: string;
  tx: Tx;
  timestamp: Date;
  logs: Log[];
  chain_id: string;
};

type Log = {
  msg_index: number;
  log: string;
  events: Event[];
};

type Event = {
  type: string;
  attributes: Attribute[];
};

type Attribute = {
  key: string;
  value: string; // Can technically be string[] in some cases, but we'll never care about them
};

type Tx =
  | {
      "@type": "/cosmos.tx.v1beta1.Tx";
      "/cosmos-tx-v1beta1-Tx": CosmosTxV1Beta1Tx;
    }
  | {
      type: "cosmos-sdk/StdTx";
      "cosmos-sdk/StdTx": {
        value: CosmosSDKStdTxValue;
      };
    };

type CosmosSDKStdTxValue = {
  msg: Msg[];
  fee: Fee;
  //signatures: Signature[];
  memo: string;
};

type Msg =
  | {
      type: "cosmos-sdk/MsgSend";
      "cosmos-sdk/MsgSend": { value: CosmosMsgSend };
    }
  | {
      type: "cosmos-sdk/MsgDelegate";
      "cosmos-sdk/MsgDelegate": { value: CosmosMsgDelegate };
    }
  | {
      type: "cosmos-sdk/MsgBeginRedelegate";
      "cosmos-sdk/MsgBeginRedelegate": { value: CosmosMsgBeginRedelegate };
    }
  | {
      type: "cosmos-sdk/MsgUndelegate";
      "cosmos-sdk/MsgUndelegate": { value: CosmosMsgUndelegate };
    }
  | {
      type: "cosmos-sdk/MsgWithdrawDelegatorReward";
      "cosmos-sdk/MsgWithdrawDelegatorReward": { value: CosmosMsgWithdrawDelegatorReward };
    };

type CosmosTxV1Beta1Tx = {
  body: Body;
  auth_info: AuthInfo;
  //signatures: string[];
};

type AuthInfo = {
  signer_infos: SignerInfo[];
  fee: Fee;
  tip?: null;
};

type Fee = {
  amount: Amount[];
  gas_limit: string;
  payer: string;
  granter: string;
};

type Amount = {
  denom: string;
  amount: string;
};

type SignerInfo = {
  public_key: PublicKey;
  mode_info: ModeInfo;
  sequence: string;
};

type ModeInfo = {
  single: Single;
};

type Single = {
  mode: Mode;
};

enum Mode {
  SignModeDirect = "SIGN_MODE_DIRECT",
  SignModeLegacyAminoJSON = "SIGN_MODE_LEGACY_AMINO_JSON",
}

type PublicKey = {
  "@type": string;
  "/cosmos-crypto-secp256k1-PubKey"?: CryptoSecp256K1PubKey;
  "/injective-crypto-v1beta1-ethsecp256k1-PubKey"?: CryptoSecp256K1PubKey;
};

type CryptoSecp256K1PubKey = {
  key: string;
};

type Body = {
  messages: Message[];
  memo: string;
  timeout_height: string;
  extension_options: any[];
  non_critical_extension_options: any[];
};

type CosmosMsgSend = {
  from_address: string;
  to_address: string;
  amount: Amount[];
};

type CosmosMsgDelegate = {
  delegator_address: string;
  validator_address: string;
  amount: Amount;
};

type CosmosMsgBeginRedelegate = {
  delegator_address: string;
  validator_src_address: string;
  validator_dst_address: string;
  amount: Amount;
};

type CosmosMsgUndelegate = {
  delegator_address: string;
  validator_address: string;
  amount: Amount;
};

type CosmosMsgWithdrawDelegatorReward = {
  delegator_address: string;
  validator_address: string;
};

type Message =
  | {
      "@type": "/cosmos.bank.v1beta1.MsgSend";
      "/cosmos-bank-v1beta1-MsgSend": CosmosMsgSend;
    }
  | {
      "@type": "/cosmos.staking.v1beta1.MsgDelegate";
      "/cosmos-staking-v1beta1-MsgDelegate": CosmosMsgDelegate;
    }
  | {
      "@type": "/cosmos.staking.v1beta1.MsgBeginRedelegate";
      "/cosmos-staking-v1beta1-MsgBeginRedelegate": CosmosMsgBeginRedelegate;
    }
  | {
      "@type": "/cosmos.staking.v1beta1.MsgUndelegate";
      "/cosmos-staking-v1beta1-MsgUndelegate": CosmosMsgUndelegate;
    }
  | {
      "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward";
      "/cosmos-distribution-v1beta1-MsgWithdrawDelegatorReward": CosmosMsgWithdrawDelegatorReward;
      //"/ibc-applications-transfer-v1-MsgTransfer": IbcApplicationsTransferV1MsgTransfer;
    }
  | BabylonCreateBTCDelegationMessage;

type CosmosSimulateTransactionResponse =
  | {
      gas_info: {
        gas_wanted: string;
        gas_used: string;
      };
      //result: any,
    }
  | {
      code: number;
      message: string;
      details: CosmosErrorDetails[];
    };

type CosmosErrorDetails = {
  //"@type": string,
  //reason: string,
  //domain: string,
  metadata: {
    ABCICode: number;
    //Codespace: "sdk"
  };
};

export type {
  CosmosAccount,
  CosmosBalance,
  CosmosDelegation,
  CosmosRedelegation,
  CosmosRewards,
  CosmosSimulateTransactionResponse,
  CosmosTransaction,
  CosmosUnbondingDelegation,
  CosmosValidator,
  MintscanAccountTransactionsResponse,
  MintscanTransaction,
};
