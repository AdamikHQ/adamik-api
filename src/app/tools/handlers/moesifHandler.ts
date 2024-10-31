import moesif, { MoesifOptions } from "moesif-nodejs";
import { NextRequest } from "next/server";
import { env } from "~/env";

const moesifOptions: MoesifOptions = {
  applicationId: env.MOESIF_APPLICATION_ID,
  logBody: true,
  isNextJsAppRouter: true,

  identifyUser: (req, res) => {
    return (req as NextRequest).headers.get("X-Adamik-Customer-Id");
  },
  getMetadata: (req, res) => {
    const planType = (req as NextRequest).headers.get("X-Adamik-Plan-Type");
    return {
      // FIXME Hardcoded for now, needs to be provided from Stripe info (or JWT token...)
      isBillable: planType === "paid",
    };
  },
};

const applyMoesifMiddleware = moesif(moesifOptions);

export default applyMoesifMiddleware;
