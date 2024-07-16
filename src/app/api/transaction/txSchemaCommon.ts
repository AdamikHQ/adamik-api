import { z } from "zod";
import { transactionDataSchema } from "../schemaCommon";

export const transactionSchema = z.union([
  z
    .object({
      // TODO: should be replaced in favor of data field
      plain: transactionDataSchema,
    })
    .openapi({
      deprecated: true,
    })
    .transform((tx) => {
      // Simplify downstream code by unifying the models
      return {
        data: tx.plain,
      };
    }),
  z.object({
    data: transactionDataSchema,
  }),
], {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_union) {
      return { message: `unsupported value "${ctx.data}" encountered` };
    }
    return { message: ctx.defaultError };
  },
});
