import { DeployAccountContractTransaction } from "starknet";

import { InvocationsDetailsWithNonce } from "starknet";

type generateAddress = (pubkey: string) => string;
type getDeployContractPayload = (pubkey: string) => Promise<{
  payload: Omit<DeployAccountContractTransaction, "signature"> & {
    toSign: string;
  };
  details: InvocationsDetailsWithNonce;
}>;

export type { generateAddress, getDeployContractPayload };
