import * as crypto from "crypto";
import fs from "fs";
import jq from "jq-web";
import { bypass, http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";
import path from "path";

const MOCKS_FOLDER_ROOT = "/src/tests/mocks";

// Some fields will have a different value at each call,
// making the related request's filename change everytime
// NOTE multiple fields can be put in the same string, separated with ','
const BLACKLIST_CHANGING_FIELDS: Record<string, string> = {
  "https://toncenter.com/api/v2/jsonRPC": ".params.body", // contains a timestamp
  "https://site1.moralis-nodes.com": ".id", // some kind of nonce per request
};

const computeMockFilepath = async (request: Request) => {
  const requestBody = await request.text();

  const fieldsToFilter = (() => {
    for (const entry of Object.entries(BLACKLIST_CHANGING_FIELDS)) {
      if (request.url.includes(entry[0])) {
        return entry[1];
      }
    }
  })();

  const filteredBody = fieldsToFilter
    ? await jq.promised.json(JSON.parse(requestBody), `del(${fieldsToFilter})`)
    : requestBody;

  const hash = crypto.createHash("md5");
  hash.update(request.url + JSON.stringify(filteredBody));
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

    let responseBody;
    if (fs.existsSync(mockFilePath)) {
      const mockResponse = fs.readFileSync(mockFilePath, { encoding: "utf-8" });

      responseBody = JSON.parse(mockResponse).response;
      console.log("Response found in mocks:", mockFilePath.split("/").pop());
    } else {
      try {
        console.log("Response NOT found in mocks, fetching...");

        if (request.bodyUsed) {
          return passthrough();
        }

        responseBody = await fetch(bypass(request.clone())).then((response) => {
          try {
            return response.json();
          } catch (e) {
            return response.text();
          }
        });

        const requestBody = await request
          .clone()
          .text()
          .then((requestString) => {
            try {
              return JSON.parse(requestString);
            } catch (e) {
              if (!!request.body) {
                console.error("Error: failed to parse response body as JSON");
                throw e;
              }
            }
          });

        fs.writeFileSync(
          mockFilePath,
          JSON.stringify(
            {
              request: {
                url: request.url,
                method: request.method,
                params: requestBody,
              },
              response: responseBody,
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
    return HttpResponse.json(responseBody);
  }),
];

export const mswServer = setupServer(...handlers);
