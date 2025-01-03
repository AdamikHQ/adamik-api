import fs from "fs";
import path from "path";
import { generateOpenAPISpec } from "~/app/tools/openapi";

const dir = path.join(__dirname, "../../public");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const fileName = "openapi.json";
const filePath = path.join(dir, fileName);

console.log(`Generating ${filePath}...`);
// Get the API URL from environment variable
const apiUrl = process.env.API_URL || "https://api.adamik.io";

const spec = generateOpenAPISpec();
spec.servers = [{ url: apiUrl }];

console.log(`Generating ${filePath} with API URL: ${apiUrl}...`);

fs.writeFileSync(filePath, JSON.stringify(spec, null, 2));
