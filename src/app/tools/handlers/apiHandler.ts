import { NextRequest, NextResponse } from "next/server";
import { z, ZodError, ZodTypeAny } from "zod";
import { fromZodError, ValidationError } from "zod-validation-error";

/**
 * The default value of the next.js route parameter
 */
export const nextRouteParamsSchema = z.record(z.union([z.any(), z.any().array()]));
export type NextRouteParams = z.infer<typeof nextRouteParamsSchema>;

type MethodCallHandler<
  In extends ZodTypeAny,
  Out extends ZodTypeAny,
  UrlParams extends ZodTypeAny = typeof nextRouteParamsSchema
> = {
  (body: z.infer<In>, params: z.infer<UrlParams>, request: NextRequest): Promise<NextResponse<z.infer<Out>>>;
};

export interface Schemas<In extends ZodTypeAny, Out extends ZodTypeAny, UrlParams extends ZodTypeAny> {
  requestSchema?: In;
  responseSchema?: Out;
  pathParamsSchema?: UrlParams;
}

export function apiHandlerWrapper<
  In extends ZodTypeAny,
  Out extends ZodTypeAny,
  UrlParams extends ZodTypeAny = typeof nextRouteParamsSchema
>(
  handler: MethodCallHandler<In, UrlParams, Out>,
  { requestSchema, pathParamsSchema: urlParamsSchema, responseSchema }: Schemas<In, UrlParams, Out> = {}
) {
  return async (
    req: NextRequest,
    context: { params?: UrlParams }
  ): ReturnType<MethodCallHandler<In, Out, UrlParams>> => {
    try {
      // add other middlewares that can't run on the edge here
      // parse the request when
      let body = (requestSchema?.parse(await req.json()) ?? (await req.json())) as z.infer<In>;
      // parse the route params
      let parsedParams = (urlParamsSchema?.parse(context.params) ?? context.params) as z.infer<UrlParams>;

      const response = await handler(body, parsedParams, req);

      // manually calls the wrapped handler
      return NextResponse.json(responseSchema ? responseSchema.parse(response) : response);
    } catch (err: unknown) {
      return handleRequestValidationError(err);
    }
  };
}

function handleRequestValidationError(e: unknown): NextResponse {
  if (e instanceof ValidationError) {
    return NextResponse.json(
      { message: e.toString(), errors: e.details },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  } else if (e instanceof ZodError) {
    return NextResponse.json(
      { message: fromZodError(e).toString(), errors: e.errors },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }
  // FIXME: maybe handle error instead of throwing it away?
  throw e;
}
