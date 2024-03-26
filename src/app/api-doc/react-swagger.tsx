"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type Props = {
  spec: Record<string, any>;
};

type Request = {
  [k: string]: any;
};

function ReactSwagger({ spec }: Props) {
  const requestInterceptor = (req: Request) => ({
    ...req,
    headers: {
      ...req.headers,
      "X-API-KEY": process.env.NEXT_PUBLIC_DEFAULT_API_KEY,
    },
  });

  return <SwaggerUI spec={spec} requestInterceptor={requestInterceptor} />;
}

export default ReactSwagger;
