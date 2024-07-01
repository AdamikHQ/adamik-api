import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

type RouteHandler = Partial<{ [key in typeof httpMethods[number]]: (req: NextRequest, ...args: any) => Promise<NextResponse> }>

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export function apiHandler(handler: RouteHandler) {
    const wrappedHandler: RouteHandler = {};

    // wrap handler methods to add global error handler
    httpMethods.forEach(method => {
        const route = handler[method];

        if (!route || typeof route !== 'function') {
            return;
        }
        wrappedHandler[method] = async (req: NextRequest, ...args) => {
            try {
                // add other middlewares that can't run on the edge here

                // manually calls the wrapped handler
                return await route(req, ...args);
            } catch (err: unknown) {
                return handleRequestValidationError(err);
            }
        };
    });

    return wrappedHandler;
}

function handleRequestValidationError(e: unknown): NextResponse {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { message: fromZodError(e).toString(), errors: e.errors },
        { status: 400, statusText: "Invalid or missing fields" }
      );
    }
    // FIXME: maybe handle error instead of throwing it away?
    throw e;
  }