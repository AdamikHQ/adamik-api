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
  "read.account.transactions.native": {
    label: "Transaction History",
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

function getMainnetId(chain: Chain): string {
  return chain.isTestnetFor || chain.id;
}

function groupChainsByMainnet(): Map<string, Chain[]> {
  const groupedChainsMap = new Map<string, Chain[]>();

  // Group chains by their base name
  Object.values(CHAINS).forEach((chain) => {
    const mainnetId = getMainnetId(chain);
    if (!groupedChainsMap.has(mainnetId)) {
      groupedChainsMap.set(mainnetId, []);
    }
    groupedChainsMap.get(mainnetId)!.push(chain);
  });

  // Sort groups by base name
  const sortedGroups = new Map(
    [...groupedChainsMap].sort(([idA], [idB]) => {
      const nameA = CHAINS[idA as ChainId]?.name;
      const nameB = CHAINS[idB as ChainId]?.name;

      return !nameA ? 1 : !nameB ? -1 : nameA.localeCompare(nameB);
    })
  );

  return sortedGroups;
}

// Function to format network identifiers
function formatNetworkIds(chains: Chain[]): string {
  return chains.map((chain) => chain.id).join(", ");
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
    header: 'style={{ textAlign: "center", border: "none", verticalAlign: "middle"}}',
  },
  CLASSES: {
    supported: "checkmark",
    unsupported: "cross",
  },
  ICONS: {
    supported: "✅",
    unsupported: "❌",
  },
} as const;

function generateTableHeader(columns: TableColumn[]): string {
  return `<table ${CONFIG.TABLE_STYLES.table}>
  <thead>
    <tr>
${columns.map((column) => `      <th ${CONFIG.TABLE_STYLES.header}>${column.label}</th>`).join("\n")}
    </tr>
  </thead>
  <tbody>
`;
}

function generateTableCell(column: TableColumn, index: number, mainChain: Chain, networkIds: string): string {
  if (index === 0) {
    return `      <td ${CONFIG.TABLE_STYLES.cell}>${mainChain?.name}</td>`;
  }
  if (index === 1) {
    return `      <td ${CONFIG.TABLE_STYLES.cellNoWrap}>${networkIds}</td>`;
  }
  if (column.featurePath) {
    const isSupported = hasFeature(mainChain.supportedFeatures, column.featurePath);
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
title: "Supported Chains"
sidebarTitle: "Supported Chains"
description: "List of blockchains supported in the Adamik API with their respective features."
---

<Info>
  You will get the same info using the [chain endpoint](../api-reference/endpoint/get-apichains) of the Adamik API.
</Info>

${generateTableHeader(columns)}`;

  // Sort and group chains
  const groupedChains = groupChainsByMainnet();

  // Generate table rows
  groupedChains.forEach((chains: Chain[], mainnetId: string) => {
    const mainChain = CHAINS[mainnetId as ChainId];
    const chainIds = chains.map((chain) => chain.id).join(", ");

    mdxContent += `    <tr>
${columns
  .map((column, index) => generateTableCell(column, index, mainChain || chains[0], chainIds))
  .join("\n")}
    </tr>
`;
  });

  // Add table closing tags and info section
  mdxContent += `  </tbody>
</table>`;

  // Write the generated content to file
  fs.writeFileSync("./doc/supported_chains.mdx", mdxContent);
}

// Execute the main function
generateChainDocumentation();
