import { createDocument, oas31 } from "zod-openapi";

import { accountHistoryOpenAPIPath } from "~/app/api/[chainId]/account/[accountId]/history/schema";
import { accountStateOpenAPIPath } from "~/app/api/[chainId]/account/[accountId]/state/schema";
import { accountStateTokensOpenAPIPath } from "~/app/api/[chainId]/account/[accountId]/state/tokens/schema";
import { addressEncodeOpenAPIPath } from "~/app/api/[chainId]/address/encode/schema";
import { addressValidateOpenAPIPath } from "~/app/api/[chainId]/address/validate/schema";
import { tokenOpenAPIPath } from "~/app/api/[chainId]/token/[tokenId]/schema";
import { transactionOpenAPIPath } from "~/app/api/[chainId]/transaction/[transactionId]/schema";
import { transactionBroadcastRawOpenAPIPath } from "~/app/api/[chainId]/transaction/broadcast/raw/schema";
import { transactionBroadcastOpenAPIPath } from "~/app/api/[chainId]/transaction/broadcast/schema";
import { transactionEncodeOpenAPIPath } from "~/app/api/[chainId]/transaction/encode/schema";
import { transactionValidateOpenAPIPath } from "~/app/api/[chainId]/transaction/validate/schema";
import { validatorsOpenAPIPath } from "~/app/api/[chainId]/validators/schema";
import { chainOpenAPIPath } from "~/app/api/chains/[chainId]/schema";
import { chainsOpenAPIPath } from "~/app/api/chains/schema";
import { apiOpenAPIPath } from "~/app/api/schema";

function generateOpenAPISpec(origin: string): oas31.OpenAPIObject {
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
        url: origin,
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      ...apiOpenAPIPath,
      ...chainsOpenAPIPath,
      ...chainOpenAPIPath,
      ...tokenOpenAPIPath,
      ...validatorsOpenAPIPath,
      ...transactionOpenAPIPath,
      ...addressEncodeOpenAPIPath,
      ...addressValidateOpenAPIPath,
      ...accountStateOpenAPIPath,
      ...accountStateTokensOpenAPIPath,
      ...accountHistoryOpenAPIPath,
      ...transactionEncodeOpenAPIPath,
      ...transactionValidateOpenAPIPath,
      ...transactionBroadcastOpenAPIPath,
      ...transactionBroadcastRawOpenAPIPath,
    },
  });

  return document;
}

export { generateOpenAPISpec };
