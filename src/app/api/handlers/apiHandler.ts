import { NextRequest, NextResponse } from "next/server";
import { handleRequestValidationError } from "../schemaCommon";

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