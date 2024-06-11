import fs from "fs";
import path from "path";
import { generateOpenAPIDoc } from "../app/swagger/generateOpenAPIDoc";

const dir = path.join(__dirname, "../../public");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const fileName = process.env.OPEN_API_FILE_NAME || "openapi.json";
const filePath = path.join(dir, fileName);

console.log(`Generating ${filePath}...`);

fs.writeFileSync(filePath, JSON.stringify(generateOpenAPIDoc(), null, 2));
