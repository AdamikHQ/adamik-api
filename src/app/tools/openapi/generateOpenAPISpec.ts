import { createDocument, oas31 } from "zod-openapi";

import { accountHistoryOpenAPIPath } from "~/app/api/[chainId]/account/[accountId]/history/schema";
import { accountStateOpenAPIPath } from "~/app/api/[chainId]/account/[accountId]/state/schema";
import { accountStateTokensOpenAPIPath } from "~/app/api/[chainId]/account/[accountId]/state/tokens/schema";
import { addressEncodeOpenAPIPath } from "~/app/api/address/encode/schema";
import { addressValidateOpenAPIPath } from "~/app/api/address/validate/schema";
import { chainsChainIdOpenAPIPath } from "~/app/api/chains/[chainId]/schema";
import { chainsChainIdTokenTokenIdOpenAPIPath } from "~/app/api/chains/[chainId]/token/[tokenId]/schema";
import { chainsChainIdTransactionTransactionIdOpenAPIPath } from "~/app/api/chains/[chainId]/transaction/[transactionId]/schema";
import { chainsChainIdValidatorsOpenAPIPath } from "~/app/api/chains/[chainId]/validators/schema";
import { chainsOpenAPIPath } from "~/app/api/chains/schema";
import { apiOpenAPIPath } from "~/app/api/schema";
import { transactionBroadcastOpenAPIPath as transactionBroadcastRawOpenAPIPath } from "~/app/api/transaction/broadcast/raw/schema";
import { transactionBroadcastOpenAPIPath } from "~/app/api/transaction/broadcast/schema";
import { transactionEncodeOpenAPIPath } from "~/app/api/transaction/encode/schema";
import { transactionValidateOpenAPIPath } from "~/app/api/transaction/validate/schema";

// Vercel env vars don't contain the "https://" part
const VERCEL_URL: string | undefined =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL;

function generateOpenAPISpec(): oas31.OpenAPIObject {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Adamik",
      version: "0.1.0",
      description: "Adamik API reference",
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
        },
      },
    },
    servers: [
      {
        url: VERCEL_URL ? `https://${VERCEL_URL}` : "https://api.adamik.io",
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      ...apiOpenAPIPath,
      ...addressEncodeOpenAPIPath,
      ...addressValidateOpenAPIPath,
      ...accountStateOpenAPIPath,
      ...accountStateTokensOpenAPIPath,
      ...accountHistoryOpenAPIPath,
      ...chainsOpenAPIPath,
      ...chainsChainIdOpenAPIPath,
      ...chainsChainIdTokenTokenIdOpenAPIPath,
      ...chainsChainIdTransactionTransactionIdOpenAPIPath,
      ...chainsChainIdValidatorsOpenAPIPath,
      ...transactionBroadcastOpenAPIPath,
      ...transactionBroadcastRawOpenAPIPath,
      ...transactionEncodeOpenAPIPath,
      ...transactionValidateOpenAPIPath,
    },
  });

  return document;
}

export { generateOpenAPISpec };
