import moesif, { MoesifOptions } from "moesif-nodejs";
import { NextRequest } from "next/server";
import { env } from "~/env";

// Moesif is the framework that we use to monitor API trafic from users,
// build their and our monitoring dashboards, and provide data to Stripe for billing

const moesifOptions: MoesifOptions = {
  applicationId: env.MOESIF_APPLICATION_ID,
  logBody: true,
  isNextJsAppRouter: true,

  identifyUser: (req, res) => {
    return (req as NextRequest).headers.get("X-Adamik-Customer-Id");
  },
};

const applyMoesifMiddleware = moesif(moesifOptions);

export default applyMoesifMiddleware;
