import { DeployAccountContractTransaction } from "starknet";

import { InvocationsDetailsWithNonce } from "starknet";

export type generateAddress = (pubkey: string) => string;
export type deployContractPayload = (pubkey: string) => Promise<{
  payload: Omit<DeployAccountContractTransaction, "signature"> & {
    toSign: string;
  };
  details: InvocationsDetailsWithNonce;
}>;
