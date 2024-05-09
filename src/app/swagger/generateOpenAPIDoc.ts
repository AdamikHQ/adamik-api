import { oas31, createDocument } from "zod-openapi";

import { addressEncodeOpenAPIPath } from "../api/address/encode/schema";
import { addressValidateOpenAPIPath } from "../api/address/validate/schema";
import { chainsOpenAPIPath } from "../api/chains/schema";
import { chainsChainIdOpenAPIPath } from "../api/chains/[chainId]/schema";
import { dataStateOpenAPIPath } from "~/app/api/data/state/schema";
import { dataValidatorsOpenAPIPath } from "../api/data/validators/schema";
import { transactionBroadcastOpenAPIPath } from "../api/transaction/broadcast/schema";
import { transactionEncodeOpenAPIPath } from "../api/transaction/encode/schema";
import { transactionValidateOpenAPIPath } from "../api/transaction/validate/schema";

// Vercel env vars don't contain the "https://" part
const VERCEL_URL: string | undefined =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL;

function generateOpenAPIDoc(): oas31.OpenAPIObject {
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
        url: VERCEL_URL ? `https://${VERCEL_URL}` : "http://localhost:3000",
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      ...addressEncodeOpenAPIPath,
      ...addressValidateOpenAPIPath,
      ...chainsOpenAPIPath,
      ...chainsChainIdOpenAPIPath,
      ...dataStateOpenAPIPath,
      ...dataValidatorsOpenAPIPath,
      ...transactionBroadcastOpenAPIPath,
      ...transactionEncodeOpenAPIPath,
      ...transactionValidateOpenAPIPath,
    },
  });

  return document;
}

export { generateOpenAPIDoc };
