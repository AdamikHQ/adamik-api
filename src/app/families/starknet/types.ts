import { CallDetails, DeployAccountContractPayload, InvocationsDetailsWithNonce } from "starknet";

type StarknetTransactionParams = {
  payload: (DeployAccountContractPayload | CallDetails) & {
    toSign: string;
    signature?: string;
  };
  details: InvocationsDetailsWithNonce;
};

export type { StarknetTransactionParams };
