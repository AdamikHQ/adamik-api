import { NextRequest, NextResponse } from "next/server";
import { z, ZodError, ZodTypeAny } from "zod";
import { fromZodIssue } from "zod-validation-error";
import { AdamikHttpError, InvalidTransactionError } from "./errors";

// Design notes:
// - We make heavy use of generics and type inference to allow for typescript type hinting (https://zod.dev/?id=writing-generic-functions)

type MethodCallHandler<In extends ZodTypeAny, Out extends ZodTypeAny, PathParams extends ZodTypeAny> = {
  (body: z.infer<In>, params: z.infer<PathParams>, request: NextRequest): Promise<AdamikResponse<Out>>;
};

export interface Schemas<In extends ZodTypeAny, Out extends ZodTypeAny, PathParams extends ZodTypeAny> {
  requestSchema?: In;
  responseSchema?: Out;
  pathParamsSchema?: PathParams;
}

export function apiHandlerWrapper<
  In extends ZodTypeAny,
  Out extends ZodTypeAny,
  PathParams extends ZodTypeAny
>(
  handler: MethodCallHandler<In, Out, PathParams>,
  { requestSchema, pathParamsSchema: urlPathParamsSchema, responseSchema }: Schemas<In, Out, PathParams> = {}
) {
  return async (req: NextRequest, context: { params?: PathParams }): Promise<NextResponse> => {
    try {
      let body: z.infer<In> = undefined;

      // don't use json() if the content-type is not application/json
      if (req.headers.get("Content-Type") === "application/json") {
        // parse the request when available, otherwise use the raw body casted to the request schema for type hinting
        body = requestSchema?.parse(await req.json()) ?? (await req.json());
      }

      // parse the route params, otherwise use the raw context params casted to the PathParams schema for type hinting
      let parsedParams = (urlPathParamsSchema?.parse(context.params) ??
        context.params) as z.infer<PathParams>;

      // manually calls the wrapped route handler (GET, POST, etc...)
      const response = await handler(body, parsedParams, req);

      // Parse back the answer from the controller to next
      return response.toNextResponse(responseSchema);
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
 * Simple wrapper around NextResponse to allow for type conversion of the body. Replace NextResponse.json() calls with AdamikResponse.json()
 */
class AdamikResponse<T extends z.ZodTypeAny> {
  // here we use z.input to allow the response to return bigints or numbers, and delegate to Zod to convert them (resulting in z.output<Out>)
  body: z.input<T>;
  init?: ResponseInit;

  private constructor(body: z.input<T>, init?: ResponseInit) {
    this.body = body;
    this.init = init;
  }

  public static json<T extends z.ZodTypeAny>(body: z.input<T>, init?: ResponseInit): AdamikResponse<T> {
    return new AdamikResponse(body, init);
  }

  toNextResponse<T extends z.ZodTypeAny>(outputSchema?: T): NextResponse {
    if (outputSchema) {
      // use zod.parse on output response body to:
      // - transform the body into the output schema (allows for type conversion like bigint -> string or number -> string)
      // - filter the output to only keep the fields defined in the output schema (effectively removing any extraneous fields, making sure we never leak any information by accident) => https://zod.dev/?id=passthrough `By default Zod object schemas strip out unrecognized keys during parsing.`
      // - always return a status field in the output only IF a schema is provided
      const parsedOutput = outputSchema.parse(this.body);

      return NextResponse.json(parsedOutput, this.init);
    }
    return NextResponse.json(this.body, this.init);
  }
}

/**
 * Handles errors thrown by anywhere in the backend
 * NB: `instanceof` tests should be in the order of the hierarchy, from most specific to most generic when inheritance is involved
 *
 * @param e Unknown error catched by the handler
 * @returns A NextResponse with the appropriate status and message
 */
function handleRequestValidationError<OutputSchema extends ZodTypeAny>(e: unknown): NextResponse {
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

function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const ret: any = {};
  keys.forEach((key) => {
    ret[key] = obj[key];
  });
  return ret;
}

export { AdamikResponse, statusFromMessage };
export type { AdamikStatus, ErrorMsg };
