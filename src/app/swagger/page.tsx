"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

interface Request {
  [k: string]: any;
}

function ReactSwagger() {
  return (
    <SwaggerUI
      requestInterceptor={(request: Request) => {
        return {
          ...request,
          headers: { ...request.headers, "X-API-KEY": process.env.NEXT_PUBLIC_DEFAULT_API_KEY },
        };
      }}
      url={"/openapi.yml"}
    />
  );
}

export default ReactSwagger;
