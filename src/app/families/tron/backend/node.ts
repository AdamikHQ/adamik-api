import { TronWeb } from "tronweb";
import { toHex } from "tronweb/utils";
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

const getTRC20TokenInfo = async (tokenId: string, ownerAddress?: string) => {
  tronWeb.setAddress(ownerAddress || tokenId);
  const contract = await tronWeb.contract().at(tokenId);

  const name = await contract.name().call();
  const symbol = await contract.symbol().call();
  const decimals = await contract.decimals().call();

  return { name, symbol, decimals };
};

const createTRC20TokenTransaction = async (tokenId: string, amount: bigint, to: string, from: string) => {
  const inputs = [
    {
      type: "address",
      value: toHex(to),
    },
    {
      type: "uint256",
      value: toHex(amount.toString()),
    },
  ];
  tronWeb.setAddress(from);

  const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
    toHex(tokenId),
    "transfer(address,uint256)",
    {
      callValue: 0,
    },
    inputs,
    toHex(from)
  );

  return transaction;
};

const estimateEnergyContract = async (tokenId: string, amount: bigint, to: string, from: string) => {
  const inputs = [
    {
      type: "address",
      value: toHex(to),
    },
    {
      type: "uint256",
      value: toHex(amount.toString()),
    },
  ];
  tronWeb.setAddress(from);

  const { energy_used, energy_penalty } = await tronWeb.transactionBuilder.triggerConstantContract(
    toHex(tokenId),
    "transfer(address,uint256)",
    {
      callValue: 0,
    },
    inputs,
    toHex(from)
  );
  const chainParameters = await getChainParameters();
  const energyPrice = chainParameters.find((p) => p.key === "getEnergyFee")?.value || 0;

  if (!energy_used || !energy_penalty) {
    return { fees: 0, energy_used: 0, energy_penalty: 0 };
  }

  return { fees: energy_used + energy_penalty * energyPrice, energy_used, energy_penalty };
};

// TRON transaction and transaction info are not readable in case of TRC20 token transactions
// because it's contract based transaction we need to be align with ABI to decode meaning of transaction
// I prefer to use tronscan API to fetch transaction info because it's easier to get transaction info
const fetchTransaction = async (transactionId: string) => {
  const transactionInfo = await tronWeb.trx.getTransactionInfo(transactionId);
  const transaction = await tronWeb.trx.getTransaction(transactionId);
  return { transactionInfo, transaction };
};

export {
  broadcast,
  createTransaction,
  createTRC20TokenTransaction,
  estimateEnergyContract,
  fetchTransaction,
  getAccount,
  getAccountResources,
  getBandwidthPrice,
  getChainParameters,
  getTRC20TokenInfo,
  isValidAddress,
};
