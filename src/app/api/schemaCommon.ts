import z from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
import {
  ChainFamily,
  ChainFeature,
  ChainId,
  EncodedTransactionFormat,
  TransactionMode,
} from "~/app/model/types_WIP";
import { CHAINS } from "../config/chains";
import { cosmosTransactionParamsSchema } from "../families/cosmos/types";
import { getService } from "../families/services";

extendZodWithOpenApi(z);

const paginationSchema = z.object({
  limit: z.number(),
  offset: z.number(),
});

// TODO Experiment with modular zod schemas:
/*
const commonTransactionSchema = z.object({
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  amount: z.string(),
  useMaxAmount: z.boolean(),
  fees: z.string().optional(),
  gas: z.string().optional(),
  nonce: z.string().optional(),
  memo: z.string().optional(),
  format: z.string().optional(),
})

const transferTransactionSchema = z.object({
  mode: z.literal("transfer"),
});

const delegateTransactionSchema = z.object({
  mode: z.literal("delegate"),
  validatorAddress: z.string()
})

const plainTransactionSchema = commonTransactionSchema.and(z.union([transferTransactionSchema, delegateTransactionSchema,]));
//*/

// DOMAIN TYPES //////////////////////////////////////////////////////////////

const chainIdSchema = z.nativeEnum(ChainId, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return { message: `unsupported value "${ctx.data}" encountered` };
    }
    return { message: ctx.defaultError };
  },
});

const toNumber = z.number().or(z.string()).pipe(z.coerce.number().positive());
const positiveBigintSchema = z
  .bigint()
  .positive()
  .or(toNumber)
  .transform((data) => BigInt(data));

const recipientSchema = z.object({
  amount: positiveBigintSchema,
  address: z.string(),
});

/**
 * @deprecated
 * TODO: remove
 */
const plainTransactionSchema = z.object({
  chainId: chainIdSchema,
  mode: z.nativeEnum(TransactionMode),
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  // TODO should be only one of [amount, useMaxAmount]
  amount: z.string().min(1).optional(),
  useMaxAmount: z.boolean().optional(),
  fees: z.string().optional(),
  gas: z.string().optional(),
  nonce: z.string().optional(),
  memo: z.string().optional(),
  format: z.nativeEnum(EncodedTransactionFormat).optional(),
  tokenId: z.string().optional(),
  validatorAddress: z.string().optional(),
  params: cosmosTransactionParamsSchema.optional(), // For more than 1 family z.union() should be used
});

const transferToManySchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER_TO_MANY),
    sender: z.string(),
    recipients: z.array(recipientSchema),
    fees: positiveBigintSchema.optional(),
  })
  .openapi({
    // ref: "TransferToMany",
    title: "TransferToMany",
  });

const transferTokenSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER_TOKEN),
    senders: z.array(z.string()),
    recipients: z.array(z.string()),
    // TODO should be only one of [amount, useMaxAmount]
    amount: z.string().optional(),
    useMaxAmount: z.boolean().optional(),
    fees: z.string().optional(),
    gas: z.string().optional(),
    nonce: z.string().optional(),
    memo: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(),
    tokenId: z.string(),
  })
  .openapi({
    // ref: "TransferToken",
    title: "TransferToken",
  });

const transferDelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER),
    senders: z.array(z.string()),
    recipients: z.array(z.string()),
    // TODO should be only one of [amount, useMaxAmount]
    amount: z.string().optional(),
    useMaxAmount: z.boolean().optional(),
    fees: z.string().optional(),
    gas: z.string().optional(),
    nonce: z.string().optional(),
    memo: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(),
  })
  .openapi({
    // ref: "Transfer",
    title: "Transfer",
  });

const transferNative = z
  .object({
    mode: z.literal(TransactionMode.DELEGATE),
    senders: z.array(z.string()),
    recipients: z.array(z.string()),
    // TODO should be only one of [amount, useMaxAmount]
    amount: z.string().optional(),
    useMaxAmount: z.boolean().optional(),
    fees: z.string().optional(),
    gas: z.string().optional(),
    nonce: z.string().optional(),
    memo: z.string().optional(),
    validateAddress: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(),
  })
  .openapi({
    // ref: "Delegate",
    title: "Delegate",
  });

const transactionDataSchema = z
  .object({
    chainId: chainIdSchema,
  })
  .and(
    z.discriminatedUnion("mode", [
      transferNative,
      transferDelegateSchema,
      transferTokenSchema,
      transferToManySchema,
    ])
  )
  // validation of transaction mode VS chain features
  .refine(
    (data) => {
      // TODO: Maybe standardize naming and/or usage? (transfer vs transaction / transaction mode vs supported features)
      switch (data.mode) {
        case TransactionMode.TRANSFER:
          return CHAINS[data.chainId].supportedFeatures.includes(ChainFeature.TRANSACTIONS_NATIVE);
        case TransactionMode.TRANSFER_TOKEN:
          return CHAINS[data.chainId].supportedFeatures.includes(ChainFeature.TRANSACTIONS_TOKENS);
        case TransactionMode.DELEGATE:
          return CHAINS[data.chainId].supportedFeatures.includes(ChainFeature.TRANSACTIONS_STAKING);
        case TransactionMode.TRANSFER_TO_MANY:
          return CHAINS[data.chainId].supportedFeatures.includes(ChainFeature.TRANSACTIONS_TO_MANY);
        default:
          return false;
      }
    },
    (data) => {
      const supportedTransactionModes = CHAINS[data.chainId].supportedFeatures.flatMap((feature) => {
        switch (feature) {
          case ChainFeature.TRANSACTIONS_NATIVE:
            return [TransactionMode.TRANSFER];
          case ChainFeature.TRANSACTIONS_TOKENS:
            return [TransactionMode.TRANSFER_TOKEN];
          case ChainFeature.TRANSACTIONS_STAKING:
            return [TransactionMode.DELEGATE];
          case ChainFeature.TRANSACTIONS_TO_MANY:
            return [TransactionMode.TRANSFER_TO_MANY];
          default:
            return []; // filter out features that don't concern transac
        }
      });
      // idea of how we could have generic errors for features, for all chains
      return {
        message: `Transaction mode ${data.mode} is not supported for ${data.chainId}`,
        fatal: true,
        code: z.ZodIssueCode.invalid_enum_value,
        path: ["mode"],
        options: supportedTransactionModes,
      };
    }
  )
  // async validation of addresses
  .superRefine(async (data, ctx) => {
    if (data.mode === TransactionMode.TRANSFER_TO_MANY) {
      if (data.chainId != ChainId.BITCOIN && data.chainId != ChainId.BITCOIN_TESTNET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `TransferToMany is not supported for ${data.chainId}`,
          fatal: true,
        });
        return z.NEVER;
      }

      const validSender = await getService(data.chainId).validateAddress(data.sender);
      if (!validSender) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Sender address ${data.sender} is invalid for ${data.chainId}`,
          path: ["sender"],
        });
      }
      for (const recipient of data.recipients) {
        const validRecipient = await getService(data.chainId).validateAddress(recipient.address);
        if (!validRecipient) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Recipient address ${recipient.address} is invalid for ${data.chainId}`,
            path: ["recipients", "address"],
          });
        }
      }
    }
    // TODO: add all of prevalidateTransactionCommon here?
  });

const errorMsgSchema = z.object({
  message: z.string(),
});

const transactionStatusSchema = z.object({
  errors: z.array(errorMsgSchema),
  warnings: z.array(errorMsgSchema),
});

const chainSchema = z.object({
  family: z.nativeEnum(ChainFamily),
  id: chainIdSchema,
  nativeId: z.string(),
  name: z.string(),
  ticker: z.string(),
  decimals: z.string(),
  isTestnet: z.boolean().optional(),
  params: z.any().optional(),
  supportedFeatures: z.nativeEnum(ChainFeature).array(),
});

export {
  chainIdSchema,
  chainSchema,
  paginationSchema,
  plainTransactionSchema,
  transactionDataSchema,
  transactionStatusSchema,
};
