import fs from "fs";
import path from "path";

if (!process.env.CHAINLIST_DIR) {
  console.error(
    "`CHAINLIST_DIR` environement variable is not set, must be set to a local checkout of https://github.com/cosmostation/chainlist"
  );
  process.exit(1);
}

const CHAINS_DIR = `${process.env.CHAINLIST_DIR}/chain`;

console.log(`Reading from: ${CHAINS_DIR}\n`);

// Collect all chains folders in chainlist repo
const chains = fs
  .readdirSync(CHAINS_DIR, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

// List to build, that concatenates token data of all Cosmos chains
let allTokens: unknown[] = [];

for (const chain of chains) {
  // For each chain, assets.json file is where IBC token data is stored
  const inputFile = `${CHAINS_DIR}/${chain}/assets.json`;
  if (!fs.existsSync(inputFile)) {
    console.warn("File does not exist " + inputFile);
    continue;
  }

  try {
    const chainTokens: any[] = require(inputFile);
    // Only keep tokens of type "ibc", add them to the list
    allTokens = allTokens.concat(chainTokens.filter((token) => (token.type = "ibc")));
  } catch {
    console.warn("Could not load " + inputFile);
    continue;
  }
}

const allTokensJSON = JSON.stringify(allTokens, null, 2);

let output = `// GENERATED, DO NOT EDIT MANUALLY
// Generated using \`pnpm gen:cosmos-tokens\`

const COSMOS_TOKENS = ${allTokensJSON}

export { COSMOS_TOKENS };
`;

const outputFile = path.join(__dirname, "../app/config/tokens/cosmos.ts");
fs.writeFileSync(outputFile, output);

console.log("\nSuccessfully wrote Cosmos IBC tokens definitions to: src/app/config/tokens/cosmos.ts\n");
