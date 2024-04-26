import { oas31, createDocument } from "zod-openapi";
import { dataStateSchemaConfig } from "~/app/api/data/state/schema";
import { addressEncodeConfig } from "../api/address/encode/schema";
import { addressValidateConfig } from "../api/address/validate/schema";
import { chainsChainIdConfig } from "../api/chains/[chainId]/schema";
import { chainsConfig } from "../api/chains/schema";
import { dataValidatorsSchemaConfig } from "../api/data/validators/schema";
import { transactionBroadcastConfig } from "../api/transaction/broadcast/schema";
import { transactionEncodeConfig } from "../api/transaction/encode/schema";
import { transactionValidateConfig } from "../api/transaction/validate/schema";

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
          type: 'apiKey',
          in: 'header',
          name: 'X-API-KEY',
        },
      },
    },
    security: [
      {
        s2sauth: [],
      },
    ],
    paths: {
      ...addressEncodeConfig,
      ...addressValidateConfig,
      ...chainsConfig,
      ...chainsChainIdConfig,
      ...dataStateSchemaConfig,
      ...dataValidatorsSchemaConfig,
      ...transactionBroadcastConfig,
      ...transactionEncodeConfig,
      ...transactionValidateConfig,
    },
  });

  return document;
}

export { generateOpenAPIDoc };
