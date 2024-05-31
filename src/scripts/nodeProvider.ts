import { CHAINS } from "../app/config/chains";
import fs from "fs";
import path from "path"

function generateReadme() {
  const chains = Object.entries(CHAINS);
  const chainsTable = chains
    .map(([chainId, chain]) => {
      const backends = Object.entries(chain.backends);
      const backendsTable = backends
        .map(([backend, url]) => {
          return `| ${backend} | ${url} |`;
        })
        .join("\n");
      return `## ${chainId}\n\n${backendsTable}`;
    })
    .join("\n\n");
  return `# Chains\n\n${chainsTable}`;
}

fs.writeFileSync(path.join(__dirname, '../..', './nodeProviders.md'), generateReadme());
