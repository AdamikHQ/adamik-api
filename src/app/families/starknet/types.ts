import { z } from "zod";
import { TransactionMode } from "~/app/model/types_WIP";

type StarknetTransactionParams = z.infer<typeof starknetTransactionParamsSchema>;

const starknetTransactionParamsSchema = z.string();

const GasBoundSchema = z.object({
  max_amount: z.string(),
  max_price_per_unit: z.string(),
});

const ResourceBoundsSchema = z.object({
  l2_gas: GasBoundSchema,
  l1_gas: GasBoundSchema,
});

const starknetTransactionParamsPayloadSchema = z.object({
  payload: z.object({
    classHash: z.string().optional(),
    contractAddress: z.string().optional(),
    addressSalt: z.string().optional(),
    constructorCalldata: z.array(z.string()).optional(),
    calldata: z.array(z.string()).optional(),
    toSign: z.string(),
    signature: z.string().optional(),
  }),
  details: z
    .object({
      tip: z.number(),
      paymasterData: z.array(z.any()),
      accountDeploymentData: z.array(z.any()),
      nonceDataAvailabilityMode: z.string(),
      feeDataAvailabilityMode: z.string(),
      resourceBounds: ResourceBoundsSchema,
      nonce: z.bigint().or(z.string()),
      maxFee: z.any(),
      version: z.string(),
    })
    .optional(),
});

type StarknetTransactionParamsToBroadcast = z.infer<typeof starknetTransactionParamsPayloadSchema> & {
  mode: TransactionMode;
};

export type { StarknetTransactionParams, StarknetTransactionParamsToBroadcast };

export { starknetTransactionParamsPayloadSchema, starknetTransactionParamsSchema };
