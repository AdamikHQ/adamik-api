import fs from "fs";
import path from "path";
import { generateOpenAPIDoc } from "../app/swagger/generateOpenAPIDoc";

const dir = path.join(__dirname, "../../public");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const fileName = process.env.OPEN_API_FILE_NAME || "openapi.json";

console.log(`Generating ${fileName}...`);

fs.writeFileSync(path.join(dir, fileName), JSON.stringify(generateOpenAPIDoc(), null, 2));
