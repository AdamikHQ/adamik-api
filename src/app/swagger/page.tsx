"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { generateOpenAPIDoc } from "./generateOpenAPIDoc";

function ReactSwagger() {
  return <SwaggerUI spec={generateOpenAPIDoc()} />;
}

export default ReactSwagger;
