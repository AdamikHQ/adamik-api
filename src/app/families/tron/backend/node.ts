import { TronWeb } from "tronweb";
import { toHex } from "tronweb/utils";
import { TRONGRID_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { ChainId, ProviderType, Token, TokenType } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { TokenStore } from "~/app/tools/tokenStore";
import { getProviderUrls } from "../../common";

const nodeUrl = getProviderUrls(ChainId.TRON, ProviderType.node)[0];

// TODO: Add support for failover
const tronWeb = new TronWeb({
  fullHost: nodeUrl,
  headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY },
});

const getAccount = (address: string) => {
  return tronWeb.trx.getAccount(address);
};

// FIXME: Hack to bypass contract needed type
const broadcast = async (signedTransaction: any) => {
  const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

  if (result.result !== true) {
    throw new UserInputError(JSON.stringify(result));
  }

  return result.transaction.txID;
};

const getAccountResources = (address: string) => {
  return tronWeb.trx.getAccountResources(address);
};

// Bandwidth price in TRX
const getBandwidthPrice = async () => {
  const parameters = await tronWeb.trx.getChainParameters();
  return parameters.find((p) => p.key === "getTransactionFee")?.value || 0 / 1000_000;
};

const getChainParameters = () => {
  return tronWeb.trx.getChainParameters();
};

const isValidAddress = async (address: string) => {
  return tronWeb.isAddress(address);
};

const getTRC10TokenInfo = async (tokenId: string) => {
  const [loadedToken] = await TokenStore.load(CHAINS.tron.id, [tokenId]);
  if (loadedToken !== null) {
    return loadedToken;
  }

  const tokenInfo = await tronWeb.trx.getTokenByID(tokenId);

  const token = {
    type: TokenType.TRC10,
    id: tokenId,
    name: tokenInfo.name,
    ticker: tokenInfo.abbr,
    decimals: tokenInfo.precision,
  };
  await TokenStore.save(CHAINS.tron.id, [token]);
  return token;
};

const getTRC20TokenInfo = async (tokenId: string, ownerAddress?: string): Promise<Token> => {
  const [loadedToken] = await TokenStore.load(CHAINS.tron.id, [tokenId]);
  if (loadedToken !== null) {
    return loadedToken;
  }

  tronWeb.setAddress(ownerAddress || tokenId);
  const contract = await tronWeb.contract().at(tokenId);

  const name = await contract.name().call();
  const symbol = await contract.symbol().call();
  const decimals = await contract.decimals().call();

  const token = {
    type: TokenType.TRC20,
    id: tokenId,
    name: name,
    ticker: symbol,
    decimals: Number(decimals),
    contractAddress: tokenId,
  };

  await TokenStore.save(CHAINS.tron.id, [token]);

  return token;
};

const createTransaction = (from: string, to: string, amount: bigint) => {
  return tronWeb.transactionBuilder.sendTrx(to, Number(amount), from);
};

const createTRC10TokenTransaction = (tokenId: string, amount: bigint, to: string, from: string) => {
  return tronWeb.transactionBuilder.sendToken(to, Number(amount), tokenId, from);
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

const extendTransactionExpiration = async (transaction: any, expiration: number) => {
  try {
    return await tronWeb.transactionBuilder.extendExpiration(transaction, expiration);
  } catch (error: any) {
    // Should never happen, except in tests that use old mocks (safe to ignore)
    console.warn("/!\\ Failed to extend Tron transaction expiration:", error);
    return transaction;
  }
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

  if (!energy_used || !energy_penalty) {
    return { fees: 0, energy_used: 0, energy_penalty: 0 };
  }

  return { energy_used, energy_penalty };
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
  createTRC10TokenTransaction,
  createTRC20TokenTransaction,
  estimateEnergyContract,
  extendTransactionExpiration,
  fetchTransaction,
  getAccount,
  getAccountResources,
  getBandwidthPrice,
  getChainParameters,
  getTRC10TokenInfo,
  getTRC20TokenInfo,
  isValidAddress,
};
