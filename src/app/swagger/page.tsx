"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { createSwaggerFile } from "./createSwaggerFile";

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
      spec={createSwaggerFile()}
    />
  );
}

export default ReactSwagger;
