import { Keyring } from "./keyring/types";
import { AlgorandKeyring } from "./keyring/Algorand";
import { CosmosKeyring } from "./keyring/Cosmos";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";

const API_URL: string =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? "https://adamik.vercel.app/api"
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}/api`
    : "http://localhost:3000/api";

// For debugging - FIXME Use env files instead?
//const API_URL: string = "https://192.168.1.150:3000/api";
//const API_URL: string = "https://localhost:3000/api";

const AUTH_HEADER: HeadersInit = {
  Authorization: process.env.DEFAULT_API_KEY || "",
};

const KEYRINGS: Map<string, Keyring> = new Map([
  ["algorand", AlgorandKeyring],
  ["cosmoshub", CosmosKeyring],
  ["osmosis", CosmosKeyring],
]);

const FAUCETS: Map<string, string> = new Map([
  ["algorand", "https://bank.testnet.algorand.network"],
  ["cosmoshub", "https://www.allthatnode.com/faucet/cosmos.dsrv"],
  ["osmosis", "https://faucet.testnet.osmosis.zone/"],
]);

async function getTransport() {
  const bluetoothAvailable = await TransportWebBLE.isSupported();
  return bluetoothAvailable ? TransportWebBLE.create() : TransportWebUSB.create();
}

// Helpers to convert from/to user-convenient format in main unit, and smallest unit of the chain
// FIXME Magnitude could be a server-side concern
function amountToSmallestUnit(amount: string, decimals: number): string | null {
  const computedAmount = parseFloat(amount) * Math.pow(10, decimals);
  return computedAmount.toString();
}

function amountToMainUnit(amount: string, decimals: number): string | null {
  const parsedAmount = parseInt(amount);
  return Number.isNaN(parsedAmount) ? null : (parsedAmount / Math.pow(10, decimals)).toString();
}

export * from "./server-types";
export { API_URL, AUTH_HEADER, KEYRINGS, FAUCETS, getTransport, amountToSmallestUnit, amountToMainUnit };
