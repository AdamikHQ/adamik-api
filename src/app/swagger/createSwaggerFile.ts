import { stringify } from "yaml";
import { createDocument, extendZodWithOpenApi } from "zod-openapi";
import { dataStateSchemaConfig } from "~/app/api/data/state/schema";
import { addressEncodeConfig } from "../api/address/encode/schema";
import { addressValidateConfig } from "../api/address/validate/schema";
import { chainsConfig } from "../api/chains/schema";
import { chainsChainIdConfig } from "../api/chains/[chainId]/schema";
import { transactionBroadcastConfig } from "../api/transaction/broadcast/schema";
import { transactionEncodeConfig } from "../api/transaction/encode/schema";
import { transactionValidateConfig } from "../api/transaction/validate/schema";

export const createSwaggerFile = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Adamik",
      version: "1.0.0",
      description: "A simple demo for zod-openapi",
      license: {
        name: "MIT",
      },
    },
    components: {
      securitySchemes: {},
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
      ...transactionBroadcastConfig,
      ...transactionEncodeConfig,
      ...transactionValidateConfig,
    },
  });

  const yaml = stringify(document, { aliasDuplicateObjects: false });

  return yaml;
};
