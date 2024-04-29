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
          name: "X-API-KEY",
        },
      },
    },
    servers: [
      {
        url: "https://adamik.vercel.app",
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
