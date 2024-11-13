import * as crypto from "crypto";
import fs from "fs";
import jq from "jq-web";
import { bypass, http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";
import path from "path";

// Some fields will have a different value at each call,
// making the related request's filename change everytime
const BLACKLIST_CHANGING_FIELDS: Record<string, string> = {
  "https://toncenter.com/api/v2/jsonRPC": ".params.body", // contains a timestamp
};

const computeFilepath = async (request: Request) => {
  const requestBody = await request.clone().text();
  const filteredBody = BLACKLIST_CHANGING_FIELDS[request.url]
    ? await jq.promised.json(JSON.parse(requestBody), `del(${BLACKLIST_CHANGING_FIELDS[request.url]})`)
    : requestBody;

  const hash = crypto.createHash("md5");
  hash.update(request.url + filteredBody);
  const fileName = hash.digest("hex") + ".json";

  return path.join(path.join(process.cwd() + "/src/mock/json"), fileName);
};

function isJsonString(str: string) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export const handlers = [
  http.all("*", async ({ request }) => {
    if (!fs.existsSync(path.join(process.cwd() + "/src/mock/json"))) {
      fs.mkdirSync(path.join(process.cwd() + "/src/mock/json"));
    }

    console.log("\n");
    console.log("-----------------");
    console.log("Request URL :", request.url);
    const filePath = await computeFilepath(request);

    console.log("File path :", filePath);
    if (fs.existsSync(filePath)) {
      const cachedResponse = fs.readFileSync(filePath, { encoding: "utf-8" });
      const json = JSON.parse(cachedResponse).response;
      console.log("cached response");
      console.log("-----------------");
      return HttpResponse.json(json);
    } else {
      try {
        console.log("FETCHING RESPONSE");
        if (!request.bodyUsed) {
          const response = await fetch(bypass(request.clone()));
          let responseReturn;
          try {
            responseReturn = await response.json();
          } catch (e) {
            responseReturn = await response.text();
          }
          console.log(responseReturn);
          console.log("-----------------");

          const requestBody = await request.clone().text();

          fs.writeFileSync(
            filePath,
            JSON.stringify(
              {
                request: {
                  url: request.url,
                  method: request.method,
                  params: requestBody
                    ? isJsonString(requestBody)
                      ? JSON.parse(requestBody)
                      : requestBody
                    : null,
                },
                response: responseReturn,
              },
              null,
              2
            ),
            { encoding: "utf-8" }
          );

          return HttpResponse.json(responseReturn);
        }
        return passthrough();
      } catch (error) {
        // Weird bug where axios from lib is not being able to fetch the request and replay it on fetch.
        // at the moment we will probably need to replay all of these data
        console.log("[NOT ABLE TO FETCH]", error);
        console.log("Request URL :", request.url);
        console.log("params :", await request.clone().text());
        console.log("method :", request.method);
        console.log("-----------------");
        return passthrough();
      }
    }
  }),
];

export const server = setupServer(...handlers);
