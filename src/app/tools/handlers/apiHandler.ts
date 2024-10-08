import { NextRequest, NextResponse } from "next/server";
import { z, ZodError, ZodType } from "zod";
import { fromZodIssue } from "zod-validation-error";
import { AdamikHttpError, InvalidTransactionError } from "./errors";

// DESIGN NOTES
// We make heavy use of generics and type inference to allow for typescript type hinting (https://zod.dev/?id=writing-generic-functions)
//
// HOW TO USE
//
// When creating a new route.ts, methods can be defined like this:
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
  return async (request: NextRequest, context: { params?: PathParams }): Promise<NextResponse> => {
    try {
      // don't use json() if the content-type is not application/json
      const isBodyJson = request.headers.get("Content-Type") === "application/json";

      // parse the request when available, otherwise use the raw body casted to the request schema for type hinting
      const requestBody: z.infer<RequestBody> = isBodyJson
        ? requestSchema?.parse(await request.json()) ?? (await request.json())
        : undefined;

      // parse the route params, otherwise use the raw context params casted to the PathParams schema for type hinting
      const pathParams = pathParamsSchema?.parse(context.params) ?? context.params;

      // parse the query params, otherwise use the raw request params casted to the PathParams schema for type hinting
      const queryParams =
        queryParamsSchema?.parse(request.nextUrl.searchParams) ?? request.nextUrl.searchParams;

      // manually calls the wrapped route handler (GET, POST, etc...)
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
    } catch (err: unknown) {
      return handleRequestValidationError(err);
    }
  };
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
function handleRequestValidationError(e: unknown): NextResponse {
  if (e instanceof InvalidTransactionError) {
    return NextResponse.json({ status: e.adamikStatus }, { status: e.status, statusText: e.statusText });
  } else if (e instanceof AdamikHttpError) {
    // catch-all for all AdamikHttpError
    return NextResponse.json(
      { status: statusFromMessage(e.message) },
      { status: e.status, statusText: e.statusText }
    );
  } else if (e instanceof ZodError) {
    // Generic catchall for all the Zod errors, parse the message through zod-validation-error for user friendliness

    return NextResponse.json(
      {
        status: {
          errors: e.issues.map((issue) => ({ message: fromZodIssue(issue).toString() })), // one error per issue for maximum readability
          warnings: [],
        },
      },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  } else if (e instanceof Error) {
    console.error("handleRequestValidationError - unexpected error:", e);
    return NextResponse.json(
      { status: statusFromMessage(e.message) },
      { status: 500, statusText: "Unexpected server error" }
    );
  }
  throw e; // should never happen
}

type ErrorCode = "OK" | "KO";

// TODO Return code, message should be on client side?
type ErrorMsg = {
  //code: ErrorCode;
  message: string;
};

type AdamikStatus = {
  errors: ErrorMsg[];
  warnings: ErrorMsg[];
};

function statusFromMessage(message: string): AdamikStatus {
  return { errors: [{ message: message }], warnings: [] };
}

export { statusFromMessage };
export type { AdamikStatus, ErrorMsg };
