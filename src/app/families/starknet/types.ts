import { DeployAccountContractTransaction, Invocation, InvocationsDetailsWithNonce } from "starknet";
import { z } from "zod";
import { TransactionMode } from "~/app/model/types_WIP";

type StarknetDeployAccountPayload = {
  payload: Omit<DeployAccountContractTransaction, "signature"> & {
    toSign: string;
  };
  details: InvocationsDetailsWithNonce;
};

type StarknetInvokePayload = {
  payload: Omit<Invocation, "signature"> & {
    toSign: string;
  };
  details: InvocationsDetailsWithNonce;
};

type generateAddress = (pubkey: string) => string;

const GasBoundSchema = z.object({
  max_amount: z.string(),
  max_price_per_unit: z.string(),
});

const ResourceBoundsSchema = z.object({
  l2_gas: GasBoundSchema,
  l1_gas: GasBoundSchema,
});

const starknetTransactionParamsSchema = z.object({
  mode: z.nativeEnum(TransactionMode),
  payload: z.object({
    classHash: z.string(),
    contractAddress: z.string(),
    addressSalt: z.string().optional(),
    constructorCalldata: z.array(z.string()).optional(),
    calldata: z.array(z.string()).optional(),
    toSign: z.string(),
    signature: z.string().optional(),
  }),
  details: z.object({
    tip: z.number(),
    paymasterData: z.array(z.any()),
    accountDeploymentData: z.array(z.any()),
    nonceDataAvailabilityMode: z.any(),
    feeDataAvailabilityMode: z.any(),
    resourceBounds: ResourceBoundsSchema,
    nonce: z.bigint().or(z.string()),
    maxFee: z.any(),
    version: z.string(),
  }),
});

type StarknetTransactionParams = z.infer<typeof starknetTransactionParamsSchema>;

export type {
  generateAddress,
  StarknetDeployAccountPayload,
  StarknetInvokePayload,
  StarknetTransactionParams,
};

export { starknetTransactionParamsSchema };
