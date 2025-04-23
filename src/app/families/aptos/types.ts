import { MoveFunctionId } from "@aptos-labs/ts-sdk";
import { z } from "zod";

export type IndexerResponse<T> = {
  data: T;
  errors?: Array<{
    message: string;
  }>;
};

export type StateChange = {
  address: string;
  state_key_hash: string;
  data: {
    type: string;
    data?: unknown;
  };
};

export type AptosTransaction = {
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash: string | null;
  gas_used: string;
  success: boolean;
  vm_status: string;
  accumulator_root_hash: string;
  changes: AptosWriteSetChange[];
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: AptosEntryFunctionPayload;
  signature: AptosSignature;
  events: AptosEvent[];
  timestamp: string;
  type: "user_transaction";
};

export type AptosWriteSetChange = AptosWriteResource | AptosWriteTableItem;

export type AptosWriteResource = {
  type: "write_resource";
  address: string;
  state_key_hash: string;
  data: {
    type: string;
    data: any; // For more detail, define specific types per module
  };
};

export type AptosWriteTableItem = {
  type: "write_table_item";
  state_key_hash: string;
  handle: string;
  key: string;
  value: string;
  data: null; // Usually null
};

export type AptosEntryFunctionPayload = {
  function: MoveFunctionId;
  arguments: string[];
  type?: string;
  type_arguments?: string[];
};

export type AptosSignature = {
  type: "ed25519_signature";
  public_key: string;
  signature: string;
};

export type AptosEvent = {
  guid: {
    creation_number: string;
    account_address: string;
  };
  sequence_number: string;
  type: string;
  data: any; // For more detail, define per event type
};

export type AptosResource = {
  type: string;
  data: unknown;
};

export type CoinStoreResource = {
  type: `0x1::coin::CoinStore<${string}>`;
  data: {
    coin: {
      value: string;
    };
    frozen: boolean;
    deposit_events: {
      counter: string;
      guid: {
        id: {
          addr: string;
          creation_num: string;
        };
      };
    };
    withdraw_events: {
      counter: string;
      guid: {
        id: {
          addr: string;
          creation_num: string;
        };
      };
    };
  };
};

export type AccountCoinResource = CoinStoreResource[];

export const AptosCoinIdentifier = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";

export type ValidatorSetResponse = {
  type: "0x1::stake::ValidatorSet";
  data: {
    active_validators: Validator[];
  };
};

export type Validator = {
  addr: string;
  config: ValidatorConfig;
  voting_power: string;
};

export type ValidatorConfig = {
  consensus_pubkey: string;
  fullnode_addresses: string;
  network_addresses: string;
  validator_index: string;
};

export type TransactionsResponse = {
  account_transactions: Array<{
    hash: string;
    version: string;
    timestamp: number;
    gas_used: string;
    sender: string;
    payload: {
      arguments: string[];
    };
  }>;
};

export type CoinData = {
  name: string;
  symbol: string;
  decimals: number;
  coin_type: string;
};

export type CoinInfosResponse = {
  coin_infos: CoinData[];
};

export type TransactionPayload = {
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: AptosEntryFunctionPayload;
  signature?: {
    type: string;
    public_key: string;
    signature: string;
  };
};

const moveStructIdSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]+::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*$/)
  .transform((val) => val as MoveFunctionId);
const transactionPayloadSchema = z.object({
  type: z.string().optional(),
  function: moveStructIdSchema,
  type_arguments: z.array(z.string()).optional(),
  arguments: z.array(z.string()),
});

const transactionParamsSchema = z.object({
  payload: transactionPayloadSchema.optional(),
  expiration_timestamp_secs: z.string().optional(),
  rawTransaction: z.string().optional(),
});

export type AptosTransactionParams = z.infer<typeof transactionParamsSchema>;
