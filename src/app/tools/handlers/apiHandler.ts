import { NextRequest, NextResponse } from "next/server";
import { z, ZodError, ZodType } from "zod";
import { Status } from "~/app/model/types_WIP";
import { mswServer } from "~/tests/tools/msw";
import { AdamikHttpError, InvalidTransactionError } from "./errors";
import applyMoesifMiddleware from "./moesifHandler";

// HOW TO USE
//
// When creating a new route.ts, http methods can be defined like this:
//
//             export const POST = apiHandler(A, B);
//
// - where A is: the collection of zod schemas representing this route (request body, response body, path params, query params)
// - where B is: the function implementing the route, that will be fully typed thanks to the schemas provided
//
// Note: some schemas are optional, but if they're not provided then the apiHandler guarantees that their data cannot be used! 🛡️✅
//

type MethodCall<
  RequestBody extends ZodType<unknown>,
  ResponseBody extends z.input<ZodType<unknown>>,
  PathParams extends ZodType<unknown>,
  QueryParams extends ZodType<unknown>
> = {
  (_: {
    body: z.infer<RequestBody>;
    pathParams: z.infer<PathParams>;
    queryParams: z.infer<QueryParams>;
    // No need to access the request at the moment, can be put back if some route needs it:
    // request: NextRequest;
  }): Promise<ResponseBody>;
};

type Schemas<
  RequestBody extends ZodType<unknown>,
  ResponseBody extends z.input<ZodType<unknown>>,
  PathParams extends ZodType<unknown>,
  QueryParams extends ZodType<unknown>
> = {
  requestSchema?: RequestBody;
  responseSchema: ResponseBody;
  pathParamsSchema?: PathParams;
  queryParamsSchema?: QueryParams;
};

export function apiHandler<
  RequestBody extends ZodType<unknown>,
  ResponseBody extends ZodType<unknown>,
  PathParams extends ZodType<unknown>,
  QueryParams extends ZodType<unknown>
>(
  {
    requestSchema,
    pathParamsSchema,
    queryParamsSchema,
    responseSchema,
  }: Schemas<RequestBody, ResponseBody, PathParams, QueryParams>,
  methodCall: MethodCall<RequestBody, z.input<ResponseBody>, PathParams, QueryParams>
) {
  if (process.env.TEST_ENV === "true") {
    mswServer.listen();
  }

  return applyMoesifMiddleware(
    async (request: NextRequest, context: { params?: unknown }): Promise<NextResponse> => {
      try {
        const hasBody = !!request.body;
        const requestBody: z.infer<RequestBody> = !hasBody
          ? undefined // Don't use json() if the request has no body
          : requestSchema?.parse(await request.json()) ?? (await request.json());

        const pathParams = parsePathParams({ pathParams: context.params, pathParamsSchema });

        const queryParams = parseQueryParams({
          queryParams: request.nextUrl.searchParams,
          queryParamsSchema,
        });

        // Manually call the wrapped http method (GET, POST, etc...)
        const responseBody = await methodCall({ body: requestBody, pathParams, queryParams });

        if (responseSchema) {
          // use zod.parse on output response body to:
          // - transform the body into the output schema (allows for type conversion like bigint -> string or number -> string)
          // - filter the output to only keep the fields defined in the output schema (effectively removing any extraneous fields, making sure we never leak any information by accident) => https://zod.dev/?id=passthrough `By default Zod object schemas strip out unrecognized keys during parsing.`
          // - always return a status field in the output only IF a schema is provided
          const parsedOutput = responseSchema.parse(responseBody);

          return NextResponse.json(parsedOutput);
        }

        return NextResponse.json(responseBody);
      } catch (e: unknown) {
        return handleRequestValidationError(e);
      }
    }
  );
}

function parsePathParams({
  pathParams,
  pathParamsSchema,
}: {
  pathParams?: unknown;
  pathParamsSchema?: ZodType<unknown>;
}) {
  return pathParamsSchema ? pathParamsSchema.parse(pathParams) : pathParams;
}

function parseQueryParams({
  queryParams,
  queryParamsSchema,
}: {
  queryParams: URLSearchParams;
  queryParamsSchema?: ZodType<unknown>;
}) {
  // Build more convenient records from the query params
  const queryParamsSingleValue: Record<string, string> = {};
  const queryParamsMultipleValues: Record<string, string[]> = {};
  queryParams.forEach((value, key) => {
    queryParamsSingleValue[`${key}`] = value;
    queryParamsMultipleValues[`${key}`] = value.split(",").filter(Boolean);
  });

  try {
    // If the schema can expect multiple values, e.g: "?include=raw,parsed"
    return queryParamsSchema?.parse(queryParamsMultipleValues);
  } catch (e: any) {
    if (e?.message?.includes("Expected string, received array")) {
      // If the schema only expects one single value, e.g: "?next=abcdef"
      return queryParamsSchema?.parse(queryParamsSingleValue);
    } else {
      throw e;
    }
  }
}

//
// ERROR HANDLING
//

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined") {
        return { message: `expected required field "${issue.path.at(-1)}" to be defined` };
      }
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);

/**
 * Handles errors thrown by anywhere in the backend
 * NB: `instanceof` tests should be in the order of the hierarchy, from most specific to most generic when inheritance is involved
 *
 * @param e Unknown error catched by the handler
 * @returns A NextResponse with the appropriate status and message
 */
// TODO Rework error management to simplify all this
// We should reduce the number of different error types
function handleRequestValidationError(e: unknown): NextResponse {
  if (e instanceof InvalidTransactionError) {
    return NextResponse.json({ status: e.adamikStatus }, { status: e.status, statusText: e.statusText });
  } else if (e instanceof AdamikHttpError) {
    // catch-all for all AdamikHttpError
    return NextResponse.json(
      { status: statusFromMessage(e.message || e.statusText) },
      { status: e.status, statusText: e.statusText }
    );
  } else if (e instanceof ZodError) {
    return NextResponse.json(
      {
        status: {
          errors: e.issues.map((issue) => ({ message: issue.message })), // one error per issue for maximum readability
          warnings: [],
        },
      },
      { status: 400, statusText: "Invalid or missing fields" }
    );

    // NOTE 'Dynamic server usage': NextJS seems to be smoke-testing the project during the build process,
    // and some expected errors end up being logged here, so we'd rather filter them as it's just noise
  } else if (e instanceof Error && !e.message.includes("Dynamic server usage")) {
    console.error("handleRequestValidationError - unexpected error:", e);

    return NextResponse.json(
      { status: statusFromMessage(e.message) },
      { status: 500, statusText: "Unexpected server error" }
    );
  }
  throw e; // should never happen
}

function statusFromMessage(message: string): Status {
  return { errors: [{ message: message }], warnings: [] };
}

export { statusFromMessage };
