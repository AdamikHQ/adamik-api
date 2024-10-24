import MD5 from "crypto-js/md5";
import fs from "fs";
import jq from "jq-web";
import { bypass, http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";
import path from "path";

const BLACKLIST_JSON_PATH_URL: Record<string, string> = {
  "https://toncenter.com/api/v2/jsonRPC": ".params.body",
};

const computeFilepath = async (request: Request) => {
  const requestBody = await request.text();
  const filteredBody = BLACKLIST_JSON_PATH_URL[request.url]
    ? await jq.promised.json(JSON.parse(requestBody), `del(${BLACKLIST_JSON_PATH_URL[request.url]})`)
    : requestBody;

  const fileName = MD5(request.url + filteredBody) + ".json";
  return path.join(path.join(process.cwd() + "/src/mock/json"), fileName);
};

export const handlers = [
  http.all("*", async ({ request }) => {
    if (!fs.existsSync(path.join(process.cwd() + "/src/mock/json"))) {
      fs.mkdirSync(path.join(process.cwd() + "/src/mock/json"));
    }

    console.log("Request URL :", request.url);
    const filePath = await computeFilepath(request);

    console.log("-----------------");
    console.log("File path :", filePath);
    if (fs.existsSync(filePath)) {
      const cachedResponse = fs.readFileSync(filePath, { encoding: "utf-8" });
      const json = JSON.parse(cachedResponse).response;
      return HttpResponse.json(json);
    } else {
      try {
        const response = await fetch(bypass(request));
        const responseJSON = await response.json();
        console.log(responseJSON);
        console.log("-----------------");

        const requestBody = await request.text();

        fs.writeFileSync(
          filePath,
          JSON.stringify(
            {
              request: {
                url: request.url,
                method: request.method,
                params: requestBody ? JSON.parse(requestBody) : null,
              },
              response: responseJSON,
            },
            null,
            2
          ),
          { encoding: "utf-8" }
        );

        return HttpResponse.json(responseJSON);
      } catch (error) {
        // Weird bug where axios from lib is not being able to fetch the request and replay it on fetch.
        // at the moment we will probably need to replay all of these data
        console.log("[NOT ABLE TO FETCH]", error);
        console.log("-----------------");
        console.log("File path :", filePath);
        console.log("Request URL :", request.url);
        console.log("method :", request.method);
        console.log("-----------------");
        return passthrough();
      }
    }
  }),
];

export const server = setupServer(...handlers);
