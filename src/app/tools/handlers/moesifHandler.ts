import moesif, { MoesifOptions } from "moesif-nodejs";
import { NextRequest } from "next/server";
import { MOESIF_APPLICATION_ID } from "~/app/config/apiKeys";

const moesifOptions: MoesifOptions = {
  applicationId: MOESIF_APPLICATION_ID,
  logBody: true,
  // @ts-ignore
  isNextJsAppRouter: true,
  debug: true,
  identifyUser: (req, res) => {
    return (req as NextRequest).headers.get("X-Adamik-Customer-Id");
  },
  getMetadata: (req, res) => {
    return {
      isBillable: true,
    };
  },
};

const applyMoesifMiddleware = moesif(moesifOptions);

export default applyMoesifMiddleware;
