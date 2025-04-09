import { Transaction as BitcoinTransaction } from "bitcoinjs-lib";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  FinalizedTransaction,
  Provider,
  ProviderType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { ThirdPartyProviderError, UserInputError } from "~/app/tools/handlers/errors";
import { BitcoinChainParams } from "../types";
import {
  MempoolSpaceAddressBalance,
  mempoolSpaceAddressBalanceSchema,
  mempoolSpaceAddressValidationSchema,
  mempoolSpaceFeesSchema,
  MempoolSpaceTransaction,
  mempoolSpaceTransactionSchema,
  MempoolSpaceUTXO,
  mempoolSpaceUtxoSchema,
} from "./mempoolSpace.types";

// TODO Just a POC for now, need to improve error handling

async function fetchTransaction(chainId: ChainId, transactionId: string): Promise<FinalizedTransaction> {
  const explorerURL = CHAINS[chainId].providers.find(
    (p: Provider) => p.type === ProviderType.mempoolspace
  )?.url;
  const url = `${explorerURL}/tx/${transactionId}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError(
      `Error while fetching transaction with ID ${transactionId} from the explorer`
    );
  }

  const result = await response.json();
  const data = mempoolSpaceTransactionSchema.parse(result);

  return await mempoolSpaceToAdamikTransaction(chainId, data);
}

async function fetchNativeTransaction(chainId: ChainId, transactionId: string): Promise<BitcoinTransaction> {
  const explorerURL = CHAINS[chainId].providers.find(
    (p: Provider) => p.type === ProviderType.mempoolspace
  )?.url;
  const url = `${explorerURL}/tx/${transactionId}/raw`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError(
      `Error while fetching raw transaction with ID ${transactionId} from the explorer`
    );
  }
  // TODO Error management

  const result = await response.bytes();

  return BitcoinTransaction.fromBuffer(Buffer.from(result));
}

async function fetchAddressUtxos(chainId: ChainId, address: string): Promise<MempoolSpaceUTXO[]> {
  const explorerURL = CHAINS[chainId].providers.find(
    (p: Provider) => p.type === ProviderType.mempoolspace
  )?.url;
  const url = `${explorerURL}/address/${address}/utxo`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError(`Error while fetching UTXOs for address ${address} from the explorer`);
  }

  const result = await response.json();

  // TODO Error management

  const data = mempoolSpaceUtxoSchema.array().parse(result);

  return data;
}

async function fetchAddressBalance(chainId: ChainId, address: string): Promise<MempoolSpaceAddressBalance> {
  const explorerURL = CHAINS[chainId].providers.find(
    (b: Provider) => b.type === ProviderType.mempoolspace
  )?.url;
  const url = `${explorerURL}/address/${address}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError(
      `Error while fetching balance for address ${address} from the explorer`
    );
  }

  const result = await response.json();

  // Parse and validate the response data
  const data = mempoolSpaceAddressBalanceSchema.parse(result);

  return data;
}

async function fetchAddressScriptPubKey(chainId: ChainId, address: string): Promise<string> {
  const explorerURL = CHAINS[chainId].providers.find(
    (p: Provider) => p.type === ProviderType.mempoolspace
  )?.url;
  const url = `${explorerURL}/v1/validate-address/${address}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError(`Error while fetching UTXOs for address ${address} from the explorer`);
  }

  const result = await response.json();

  // TODO Error management

  const data = mempoolSpaceAddressValidationSchema.parse(result);

  return data.scriptPubKey;
}

async function fetchFeePerByte(chainId: ChainId): Promise<number> {
  const explorerURL = CHAINS[chainId].providers.find(
    (p: Provider) => p.type === ProviderType.mempoolspace
  )?.url;
  const url = `${explorerURL}/v1/fees/recommended`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching fee per byte data from the explorer");
  }

  const result = await response.json();

  // TODO Error management?...
  // if (result.context.code !== 200) {
  //   console.warn(
  //     `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
  //     JSON.stringify(result)
  //   );
  //   throw new ThirdPartyProviderError("Error in fee per byte data received from the explorer");
  // }

  const data = mempoolSpaceFeesSchema.parse(result);

  // NOTE Abritrary choice of fee, maybe another one is better?
  return data.economyFee;
}

async function postTransaction(chainId: ChainId, payload: string): Promise<string> {
  const explorerURL = CHAINS[chainId].providers.find(
    (p: Provider) => p.type === ProviderType.mempoolspace
  )?.url;
  const url = `${explorerURL}/tx`;

  const response = await fetch(url, {
    method: "POST",
    body: payload,
  });
  // FIXME DEBUG TBR
  console.log("M.S - url:", url);
  console.log("M.S - payload:", payload);
  console.log("M.S - response.ok:", response.ok);
  console.log("M.S - response.status:", response.status);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new UserInputError(`Transaction broadcast failed`);
  }

  // Transaction hash is just returned as plain text
  const txHash = await response.text();

  return txHash;
}

async function fetchLatestBlockHeight(chainId: ChainId): Promise<number> {
  const explorerURL = CHAINS[chainId].providers.find(
    (p: Provider) => p.type === ProviderType.mempoolspace
  )?.url;
  const url = `${explorerURL}/blocks/tip/height`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching latest block height from the explorer");
  }

  // The response is a plain text number
  const height = await response.text();
  return parseInt(height, 10);
}

async function mempoolSpaceToAdamikTransaction(
  chainId: ChainId,
  mempoolSpaceTransaction: MempoolSpaceTransaction
): Promise<FinalizedTransaction> {
  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: mempoolSpaceTransaction.txid,
    // NOTE Impossible to check for other tx modes (e.g staking) with bitcoin
    // explorer alone, needs to be refined by the caller of this function
    mode: TransactionMode.TRANSFER,
    state: TransactionState.UNKNOWN,
    fees: {
      amount: BigInt(mempoolSpaceTransaction.fee),
    },
    senders: mempoolSpaceTransaction.vin.map((input) => ({
      address: input.prevout.scriptpubkey_address || input.prevout.scriptpubkey,
      amount: BigInt(input.prevout.value),
    })),
    recipients: mempoolSpaceTransaction.vout.map((output) => ({
      address: output.scriptpubkey_address || output.scriptpubkey,
      amount: BigInt(output.value),
    })),
  };

  const transactionBlockHeight = mempoolSpaceTransaction.status.block_height;
  const transactionTimestamp = mempoolSpaceTransaction.status.block_time;
  if (
    !mempoolSpaceTransaction.status.confirmed ||
    transactionBlockHeight === undefined ||
    transactionTimestamp === undefined
  ) {
    parsedTransaction.state = TransactionState.PENDING;
  } else {
    const bitcoinParams = CHAINS[chainId].params as BitcoinChainParams;
    const latestBlockHeight = await fetchLatestBlockHeight(chainId);
    const isTransactionConfirmed = latestBlockHeight - transactionBlockHeight >= bitcoinParams.confirmations;

    parsedTransaction.state = isTransactionConfirmed
      ? TransactionState.CONFIRMED
      : TransactionState.UNCONFIRMED;

    parsedTransaction.blockHeight = BigInt(transactionBlockHeight);
    parsedTransaction.timestamp = transactionTimestamp * 1000;
  }

  return {
    raw: mempoolSpaceTransaction,
    parsed: parsedTransaction,
  };
}

export {
  fetchAddressBalance,
  fetchAddressScriptPubKey,
  fetchAddressUtxos,
  fetchFeePerByte,
  fetchLatestBlockHeight,
  fetchNativeTransaction,
  fetchTransaction,
  postTransaction,
};
