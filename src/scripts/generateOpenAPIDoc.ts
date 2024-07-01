import fs from "fs";
import path from "path";
import { generateOpenAPISpec } from "~/app/tools/openapi/generateOpenAPISpec";

const dir = path.join(__dirname, "../../public");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const fileName = "openapi.json";
const filePath = path.join(dir, fileName);

console.log(`Generating ${filePath}...`);

fs.writeFileSync(filePath, JSON.stringify(generateOpenAPISpec(), null, 2));
