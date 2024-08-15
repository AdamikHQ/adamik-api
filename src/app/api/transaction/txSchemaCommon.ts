import { z } from "zod";
import { transactionDataSchema } from "../schemaCommon";

const newTransactionSchema = z
  .object({
    data: transactionDataSchema,
  })
  .openapi({
    title: "transaction data",
  });

const oldTransactionSchema = z
  .object({
    // TODO: should be replaced in favor of data field
    plain: transactionDataSchema,
  })
  .openapi({
    deprecated: true,
    title: "transaction plain data",
  });

export const transactionSchema = newTransactionSchema
  .or(oldTransactionSchema)
  .transform((tx) => {
    if ("plain" in tx) {
      // Simplify internal code and return type by unifying the models
      return {
        data: tx.plain,
      };
    }
    return tx;
  })
  .pipe(newTransactionSchema); // forces zod-openapi to use the new schema as output
