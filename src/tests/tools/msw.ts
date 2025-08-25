import * as crypto from "crypto";
import fs from "fs";
import { bypass, http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";
import path from "path";

import { evaluate, parse } from "@jq-tools/jq";

const MOCKS_FOLDER_ROOT = "/src/tests/mocks";

// Some fields will have a different value at each call,
// making the related request's filename change everytime
// NOTE multiple fields can be put in the same string, separated with ','
const BLACKLIST_CHANGING_FIELDS: Record<string, string> = {
  "https://toncenter.com/api/v2/jsonRPC": ".params.body", // contains a timestamp
  "*": ".id", // some kind of nonce per request
};

async function applyFilters(requestUrl: string, requestBody: string): Promise<string> {
  if (!requestBody?.length) {
    return requestBody;
  }

  const fieldsToFilter = (() => {
    for (const entry of Object.entries(BLACKLIST_CHANGING_FIELDS)) {
      if (entry[0] === "*" || requestUrl.includes(entry[0])) {
        return entry[1];
      }
    }
  })();

  if (!fieldsToFilter) {
    return requestBody;
  }

  try {
    const json = JSON.parse(requestBody);
    // Use jq to apply JSON filters on the request body
    const filter = parse(`del(${fieldsToFilter})`);
    const result = evaluate(filter, [json]).next().value;
    return JSON.stringify(result);
  } catch (e) {
    console.warn(`Error while using jq to filter request body: ${e}`);
    console.warn(`    Request body: ${requestBody}`);
    console.warn(`    Error: ${e}`);
    return requestBody;
  }
}

const computeMockFilepath = async (request: Request) => {
  const requestBody = await request.text();

  const filteredBody = await applyFilters(request.url, requestBody);

  const hash = crypto.createHash("md5");
  hash.update(request.url + filteredBody);
  const fileName = hash.digest("hex") + ".json";

  return path.join(path.join(process.cwd() + MOCKS_FOLDER_ROOT), fileName);
};

// Build the mock files for the responses of all intercepted HTTP requests
const handlers = [
  http.all("*", async ({ request }) => {
    console.log("\n");
    console.log(">>>>>>>>>> MSW");
    if (!fs.existsSync(path.join(process.cwd() + MOCKS_FOLDER_ROOT))) {
      fs.mkdirSync(path.join(process.cwd() + MOCKS_FOLDER_ROOT));
    }

    console.log("Request:", request.method + " " + request.url);
    const mockFilePath = await computeMockFilepath(request.clone());

    let responseBody: string;
    let responseStatus: number;
    let responseType: string;
    if (fs.existsSync(mockFilePath)) {
      console.log("Response found in mocks:", mockFilePath.split("/").pop());

      const mockResponse = fs.readFileSync(mockFilePath, { encoding: "utf-8" });
      const mockResponseJson = JSON.parse(mockResponse);

      responseBody = mockResponseJson.response.body;
      responseStatus = mockResponseJson.response.status;
      responseType = mockResponseJson.response.type;
    } else {
      try {
        console.log("Response NOT found in mocks, fetching...");

        if (request.bodyUsed) {
          return passthrough();
        }

        let requestBody: unknown = undefined;
        if (!!request.body) {
          try {
            requestBody = await request.clone().json();
          } catch (e) {
            requestBody = await request.clone().text();
          }
        }

        // FIXME Weird infinite loop may happen with this fetch() in some cases where the endpoint returns an error...
        // (since msw v2.7.0, need to check later if a newer version fixes this)
        const response = await fetch(bypass(request));

        responseStatus = response.status;

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json") || contentType.includes("application/hal+json")) {
          // Handle JSON responses
          responseType = "json";
          responseBody = await response.clone().json();
        } else if (contentType.includes("text/")) {
          // Handle text-based responses
          responseType = "text";
          responseBody = await response.clone().text();
        } else if (contentType.includes("application/octet-stream")) {
          // Handle binary responses
          responseType = "binary";
          // Convert to base64 to store in JSON
          const binary = await response.clone().bytes();
          responseBody = Buffer.from(binary).toString("base64");
        } else {
          // Fallback for unknown content types - treat as text
          console.log(`Unknown content type: ${contentType}, treating as text`);
          responseType = "unknown";
          responseBody = await response.clone().text();
        }

        fs.writeFileSync(
          mockFilePath,
          JSON.stringify(
            {
              request: {
                url: request.url,
                method: request.method,
                body: requestBody,
              },
              response: {
                status: responseStatus,
                body: responseBody,
                type: responseType,
              },
            },
            null,
            2
          ),
          { encoding: "utf-8" }
        );
      } catch (error) {
        // Weird bug where axios from lib is not being able to fetch the request and replay it on fetch.
        // at the moment we will probably need to replay all of these data
        console.log("[NOT ABLE TO FETCH]", error);
        console.log("Request URL :", request.url);
        console.log("params :", await request.clone().text());
        console.log("method :", request.method);
        return passthrough();
      }
    }

    console.log("<<<<<<<<<< MSW");

    if (responseType === "binary") {
      return new HttpResponse(Buffer.from(responseBody, "base64"), { status: responseStatus });
    } else if (responseType === "text") {
      return HttpResponse.text(responseBody, { status: responseStatus });
    } else {
      return HttpResponse.json(responseBody, { status: responseStatus });
    }
  }),
];

export const mswServer = setupServer(...handlers);
