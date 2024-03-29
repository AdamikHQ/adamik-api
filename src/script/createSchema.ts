import { stringify } from "yaml";
import { createDocument } from "zod-openapi";
import fs from "fs";
import path from "path";
import { dataStateSchemaConfig } from "~/app/api/data/state/schema";

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
    ...dataStateSchemaConfig,
  },
});

const yaml = stringify(document, { aliasDuplicateObjects: false });

// eslint-disable-next-line no-sync
fs.writeFileSync(path.join(__dirname, "../../public/openapi.yml"), yaml);
