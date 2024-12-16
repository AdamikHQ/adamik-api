import { InvalidPaginationTokenError } from "~/app/tools/handlers/errors";

// Convert any pagination data ("next" cursor, from/to timestamp, offset/limit parameters, etc...)
// to a base64 string, that can be conveniently included in API responses
function paginationToB64(data: unknown): string | null {
  if (!data) {
    return null;
  }

  try {
    return Buffer.from(JSON.stringify(data)).toString("base64");
  } catch (e) {
    return null;
  }
}

// Convert back a base64 pagination token provided in an API request, to the original pagination data
// ("next" cursor, from/to timestamp, offset/limit parameters, etc...)
function paginationFromB64(tokenB64?: string): unknown | null {
  if (!tokenB64) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(tokenB64, "base64").toString("utf8"));
  } catch (e) {
    throw new InvalidPaginationTokenError("Provided pagination token is invalid");
  }
}

export { paginationFromB64, paginationToB64 };
