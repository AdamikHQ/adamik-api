import { Keyring } from "./keyring/types";
import { AlgorandKeyring } from "./keyring/Algorand";
import { CosmosKeyring } from "./keyring/Cosmos";

const API: string = process.env.NEXT_PUBLIC_ADAMIK_API || "http://localhost:3000/api";

const KEYRINGS: Map<string, Keyring> = new Map([
  ["algorand", AlgorandKeyring],
  ["cosmos", CosmosKeyring],
]);

export { API, KEYRINGS };
