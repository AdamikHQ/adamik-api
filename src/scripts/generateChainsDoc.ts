import * as fs from "fs";
import { CHAINS } from "../app/config/chains";
import { Chain, ChainId, ChainSupportedFeatures } from "../app/model/types_WIP";

// Type utilities to get all possible paths in an object type
type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? `${K}.${PathImpl<T[K], keyof T[K]>}`
    : K
  : never;

type Path<T> = PathImpl<T, keyof T> | keyof T;
type Paths<T> = Path<T> extends string | keyof T ? Path<T> : never;

// Get all possible paths in ChainSupportedFeatures
type ChainFeaturePaths = Paths<ChainSupportedFeatures>;

// Interface for table column definition
interface TableColumn {
  label: string;
  featurePath?: ChainFeaturePaths;
}

// Feature columns configuration with paths as keys
const featureColumns: Partial<Record<ChainFeaturePaths, TableColumn>> = {
  "read.account.balances.native": {
    label: "Native Balance",
  },
  "read.account.balances.tokens": {
    label: "Token Balance",
  },
  "write.transaction.type.native": {
    label: "Native Transfer",
  },
  "write.transaction.type.tokens": {
    label: "Token Transfer",
  },
  "read.account.balances.staking": {
    label: "Staking and Rewards",
  },
};

// Function to generate table columns configuration
function generateTableColumns(): TableColumn[] {
  // Static columns
  const staticColumns: TableColumn[] = [{ label: "Blockchain Name" }, { label: "Network Identifier" }];

  // Feature columns derived from configuration
  const dynamicColumns = Object.entries(featureColumns).map(([path, column]) => ({
    ...column,
    featurePath: path as ChainFeaturePaths,
  }));

  return [...staticColumns, ...dynamicColumns];
}

// Type-safe function to check if a feature is supported
function hasFeature<T extends ChainSupportedFeatures>(features: T, featurePath: ChainFeaturePaths): boolean {
  const paths = featurePath.split(".") as Array<keyof ChainSupportedFeatures>;
  return paths.reduce((obj: any, path) => obj?.[path], features) ?? false;
}

const TESTNET_IDENTIFIERS = [" Fuji Testnet", " Testnet", " Amoy", " Chiado", " Sepolia"] as const;

// TODO: move to chains.ts so that testnet chains advertise their base chain?
function getBaseChainName(chain: Chain): string {
  // FIXME: Injective testnet is a special case
  if (!chain.isTestNet || chain.id === ChainId.INJECTIVE_TESTNET) {
    return chain.name;
  }

  // Special cases for testnets that don't follow the pattern "<BaseName> <TestnetName>"
  switch (chain.id) {
    case ChainId.ARBITRUM_SEPOLIA:
      return CHAINS[ChainId.ARBITRUM].name;
    case ChainId.CHILIZ_TESTNET:
      return CHAINS[ChainId.CHILIZ].name;
    case ChainId.MOONBASE:
      return CHAINS[ChainId.MOONBEAM].name;
    case ChainId.SEPOLIA:
    case ChainId.HOLESKY:
      return CHAINS[ChainId.ETHEREUM].name;
  }

  // Simple renaming for testnets of the form "<BaseName> <TestnetName>"
  const knownTestnetPostfix = TESTNET_IDENTIFIERS.find((identifier) => chain.name.includes(identifier));
  if (knownTestnetPostfix) {
    return chain.name.replace(knownTestnetPostfix, "");
  }

  throw new Error(`Encountered unknown testnet chain: ${chain.id}`);
}

// Function to sort and group chains
function groupChains(chains: Chain[]): Chain[][] {
  const groupedChainsMap = new Map<string, Chain[]>();

  // Group chains by their base name
  chains.forEach((chain) => {
    const baseName = getBaseChainName(chain);
    if (!groupedChainsMap.has(baseName)) {
      groupedChainsMap.set(baseName, []);
    }
    groupedChainsMap.get(baseName)!.push(chain);
  });

  // Sort groups by base name
  const sortedGroups = Array.from(groupedChainsMap.entries())
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
    .map(([_, chains]) => {
      // Sort chains within each group: main chain first, then testnets
      return chains.sort((a, b) => {
        if (a.isTestNet && !b.isTestNet) return 1;
        if (!a.isTestNet && b.isTestNet) return -1;
        return 0;
      });
    });

  return sortedGroups;
}

// Function to format network identifiers
function formatNetworkIds(chains: Chain[]): string {
  const mainnetIds: string[] = [];
  const testnetIds: string[] = [];

  chains.forEach((chain) => {
    if (chain.isTestNet) {
      testnetIds.push(chain.id);
    } else {
      mainnetIds.push(chain.id);
    }
  });

  return [...mainnetIds, ...testnetIds].join(", ");
}

/// Documentation generation functions
/** Configuration constants */
const CONFIG = {
  OUTPUT_FILE: "./chains_supported.mdx",
  TABLE_STYLES: {
    centerAlign: 'style={{ textAlign: "center" }}',
    table: 'style={{ borderCollapse: "collapse", border: "none" }}',
    cell: 'style={{ textAlign: "center", border: "none"}}',
    // Add a combined style for cells that need both center alignment and nowrap
    cellNoWrap: 'style={{ textAlign: "center", border: "none", whiteSpace: "nowrap"}}',
  },
  CLASSES: {
    supported: "checkmark",
    unsupported: "cross",
  },
  ICONS: {
    supported: "✓",
    unsupported: "✗",
  },
} as const;

/** Document structure constants */
const MDX_TEMPLATE = {
  HEADER: `---
icon: link
---

List of blockchains supported in the Adamik API with their respective features.`,
  INFO_FOOTER: `
<Info>
  You will get the same result using the [chain endpoint](../api-reference/endpoint/get-apichains) of the Adamik API.
</Info>`,
} as const;

function generateTableHeader(columns: TableColumn[]): string {
  return `<table ${CONFIG.TABLE_STYLES.table}>
  <thead>
    <tr>
${columns.map((column) => `      <th ${CONFIG.TABLE_STYLES.cell}>${column.label}</th>`).join("\n")}
    </tr>
  </thead>
  <tbody>
`;
}

function generateTableCell(column: TableColumn, index: number, chain: Chain, networkIds: string): string {
  if (index === 0) {
    return `      <td ${CONFIG.TABLE_STYLES.cell}>${chain.name}</td>`;
  }
  if (index === 1) {
    return `      <td ${CONFIG.TABLE_STYLES.cellNoWrap}>${networkIds}</td>`;
  }
  if (column.featurePath) {
    const isSupported = hasFeature(chain.supportedFeatures, column.featurePath);
    return `      <td ${CONFIG.TABLE_STYLES.cell} class="${
      isSupported ? CONFIG.CLASSES.supported : CONFIG.CLASSES.unsupported
    }">
        ${isSupported ? CONFIG.ICONS.supported : CONFIG.ICONS.unsupported}
      </td>`;
  }
  return `      <td ${CONFIG.TABLE_STYLES.cell}></td>`;
}

// Main function to generate documentation
function generateChainDocumentation(): void {
  const columns = generateTableColumns();

  let mdxContent: string = `---
icon: link
---

List of blockchains supported in the Adamik API with their respective features.

${generateTableHeader(columns)}`;

  // Sort and group chains
  const groupedChains = groupChains(Object.values(CHAINS));

  // Generate table rows
  groupedChains.forEach((chains: Chain[]) => {
    const mainChain = chains[0]; // First chain in group (mainnet)
    const networkIds = formatNetworkIds(chains);

    mdxContent += `    <tr>
${columns.map((column, index) => generateTableCell(column, index, mainChain, networkIds)).join("\n")}
    </tr>
`;
  });

  // Add table closing tags and info section
  mdxContent += `  </tbody>
</table>

<Info>
  You will get the same result using the [chain endpoint](../api-reference/endpoint/get-apichains) of the Adamik API.
</Info>`;

  // Write the generated content to file
  fs.writeFileSync("./doc/chains_supported.mdx", mdxContent);
}

// Execute the main function
generateChainDocumentation();
