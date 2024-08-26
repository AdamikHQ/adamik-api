import { createDocument, oas31 } from "zod-openapi";

import { addressEncodeOpenAPIPath } from "~/app/api/addresses/encode/schema";
import { accountStateOpenAPIPath } from "~/app/api/account/state/schema";
import { addressesStateOpenAPIPath } from "~/app/api/addresses/state/schema";
import { addressValidateOpenAPIPath } from "~/app/api/addresses/validate/schema";
import { chainsChainIdOpenAPIPath } from "~/app/api/chains/[chainId]/schema";
import { chainsChainIdTokenTokenIdOpenAPIPath } from "~/app/api/chains/[chainId]/token/[tokenId]/schema";
import { chainsChainIdValidatorsOpenAPIPath } from "~/app/api/chains/[chainId]/validators/schema";
import { chainsOpenAPIPath } from "~/app/api/chains/schema";
import { apiOpenAPIPath } from "~/app/api/schema";
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
      description: "Adamik API reference (still WIP)",
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
      ...chainsOpenAPIPath,
      ...chainsChainIdOpenAPIPath,
      ...chainsChainIdTokenTokenIdOpenAPIPath,
      ...accountStateOpenAPIPath,
      ...addressesStateOpenAPIPath,
      ...chainsChainIdValidatorsOpenAPIPath,
      ...transactionBroadcastOpenAPIPath,
      ...transactionEncodeOpenAPIPath,
      ...transactionValidateOpenAPIPath,
    },
  });

  return document;
}

export { generateOpenAPISpec };
