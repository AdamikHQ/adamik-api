import { Transaction } from "bitcoinjs-lib";
import { CHAINS } from "~/app/config/chains";
import { Backend, ChainId, ProviderType } from "~/app/model/types_WIP";
import { ThirdPartyProviderError, UserInputError } from "~/app/tools/handlers/errors";
import {
  mempoolSpaceAddressValidationSchema,
  mempoolSpaceFeesSchema,
  MempoolSpaceUTXO,
  mempoolSpaceUtxoSchema,
} from "./mempoolSpace.types";

// TODO Just a POC for now, need to improve error handling

async function fetchTransactionRaw(chainId: ChainId, transactionId: string): Promise<Transaction> {
  const explorerURL = CHAINS[chainId].backends.find(
    (b: Backend) => b.providerType === ProviderType.indexer
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

  const result = await response.arrayBuffer();

  // TODO Test this
  const data = Transaction.fromBuffer(Buffer.from(result));

  return data;
}

async function fetchAddressUtxos(chainId: ChainId, address: string): Promise<MempoolSpaceUTXO[]> {
  const explorerURL = CHAINS[chainId].backends.find(
    (b: Backend) => b.providerType === ProviderType.indexer
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

async function fetchAddressScriptPubKey(chainId: ChainId, address: string): Promise<string> {
  const explorerURL = CHAINS[chainId].backends.find(
    (b: Backend) => b.providerType === ProviderType.indexer
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
  const explorerURL = CHAINS[chainId].backends.find(
    (b: Backend) => b.providerType === ProviderType.indexer
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
  const explorerURL = CHAINS[chainId].backends.find(
    (b: Backend) => b.providerType === ProviderType.indexer
  )?.url;
  const url = `${explorerURL}/tx`;

  const response = await fetch(url, {
    method: "POST",
    body: payload,
  });

  if (!response.ok) {
    throw new UserInputError(`Transaction broadcast failed`);
  }

  // Transaction hash is just returned as plain text
  const txHash = await response.text();

  return txHash;
}

export { fetchAddressScriptPubKey, fetchAddressUtxos, fetchFeePerByte, fetchTransactionRaw, postTransaction };
