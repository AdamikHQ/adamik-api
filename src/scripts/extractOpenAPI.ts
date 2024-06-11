import fs from "fs";
import path from "path";
import { generateOpenAPIDoc } from "../app/swagger/generateOpenAPIDoc";

const dir = path.join(__dirname, "../../public");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

fs.writeFileSync(path.join(dir, "openapi.json"), JSON.stringify(generateOpenAPIDoc(), null, 2));
