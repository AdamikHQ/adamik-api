import fs from "fs";
import path from "path";
import { CHAINS } from "~/app/config/chains";

function generateProvidersMarkdown() {
  const chains = Object.entries(CHAINS);
  const chainsTable = chains
    .map(([chainId, chain]) => {
      const backendsTable = chain.providers
        .map(({ type, url }) => {
          return `| ${type} | ${url} |`;
        })
        .join("<br />\n");
      return `## ${chainId}\n\n${backendsTable}`;
    })
    .join("\n\n");
  return `# Chains\n\n${chainsTable}`;
}

const dir = path.join(__dirname, "../../doc");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

fs.writeFileSync(path.join(dir, "Providers.md"), generateProvidersMarkdown());
