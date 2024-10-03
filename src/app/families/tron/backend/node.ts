import { TronWeb } from "tronweb";
import { TRONGRID_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";

const tronWeb = new TronWeb({
  fullHost: `${CHAINS.tron.backends.nodeURL}`,
  headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY },
});

const getAccount = async (address: string) => {
  const account = await tronWeb.trx.getAccount(address);
  return account;
};

const createTransaction = async (to: string, amount: bigint, from: string) => {
  const transaction = await tronWeb.transactionBuilder.sendTrx(to, Number(amount), from);

  return transaction;
};

// FIXME: Hack to bypass contract needed type
const broadcast = async (signedTransaction: any) => {
  const result = await tronWeb.trx.sendRawTransaction(signedTransaction);
  return result.transaction.txID;
};

const getAccountResources = async (address: string) => {
  const accountResources = await tronWeb.trx.getAccountResources(address);
  return accountResources;
};

// Bandwidth price in TRX
const getBandwidthPrice = async () => {
  const parameters = await tronWeb.trx.getChainParameters();
  const bandwidthPrice = parameters.find((p) => p.key === "getTransactionFee")?.value || 0 / 1000_000;
  return bandwidthPrice;
};

const getChainParameters = async () => {
  const parameters = await tronWeb.trx.getChainParameters();
  return parameters;
};

const isValidAddress = async (address: string) => {
  const isValid = tronWeb.isAddress(address);
  return isValid;
};

const getTRC20TokenInfo = async (tokenId: string) => {
  const tokenInfo = await tronWeb.contract().at(tokenId);

  const name = await tokenInfo.name();
  const symbol = await tokenInfo.symbol();
  const decimals = await tokenInfo.decimals();
  const logo = await tokenInfo.logo();

  return { name, symbol, decimals, logo };
};

export {
  broadcast,
  createTransaction,
  getAccount,
  getAccountResources,
  getBandwidthPrice,
  getChainParameters,
  getTRC20TokenInfo,
  isValidAddress,
};
