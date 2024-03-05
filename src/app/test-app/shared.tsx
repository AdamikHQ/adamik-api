import { Keyring } from "./keyring/types";
import { AlgorandKeyring } from "./keyring/Algorand";
import { CosmosKeyring } from "./keyring/Cosmos";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";

const API: string = process.env.NEXT_PUBLIC_ADAMIK_API || "http://localhost:3000/api";

const KEYRINGS: Map<string, Keyring> = new Map([
  ["algorand", AlgorandKeyring],
  ["cosmos", CosmosKeyring],
]);

const FAUCETS: Map<string, string> = new Map([
  ["algorand", "https://bank.testnet.algorand.network"],
  ["cosmos", "https://www.allthatnode.com/faucet/cosmos.dsrv"],
]);

// Must match server type
type Chain = {
  id: string;
  name: string;
  family: string;
  ticker: string;
  magnitude: number;
};

async function getTransport() {
  const bluetoothAvailable = await TransportWebBLE.isSupported();
  return bluetoothAvailable ? TransportWebBLE.create() : TransportWebUSB.create();
}

// Helpers to convert from/to user-convenient format in main unit, and smallest unit of the chain
// FIXME Magnitude could be a server-side concern
function amountToSmallestUnit(amount: string, magnitude: number): string | null {
  const computedAmount = parseFloat(amount) * Math.pow(10, magnitude);
  return computedAmount.toString();
}

function amountToMainUnit(amount: string, magnitude: number): string | null {
  const parsedAmount = parseInt(amount);
  return Number.isNaN(parsedAmount) ? null : (parsedAmount / Math.pow(10, magnitude)).toString();
}

export type { Chain };
export { API, KEYRINGS, FAUCETS, getTransport, amountToSmallestUnit, amountToMainUnit };
