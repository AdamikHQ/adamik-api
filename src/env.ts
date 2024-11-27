import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    EDGE_CONFIG: z.string().url(),
    MOESIF_APPLICATION_ID: z.string().min(1).optional(),
    TEST_ENV: z.string().optional(),
  },

  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    EDGE_CONFIG: process.env.EDGE_CONFIG,
    MOESIF_APPLICATION_ID: process.env.MOESIF_APPLICATION_ID,
    TEST_ENV: process.env.TEST_ENV,
  },
});

export { env };
