import { Transaction as BitcoinTransaction } from "bitcoinjs-lib";
import { CHAINS } from "~/app/config/chains";
import { fetchBabylonDelegation } from "~/app/families/babylon/backend/babylonAPI";
import {
  AccountState,
  ChainId,
  FinalizedTransaction,
  ProviderType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { ThirdPartyProviderError, UserInputError } from "~/app/tools/handlers/errors";
import { getProviderUrls } from "../../common";
import { BitcoinChainParams, UtxoWithMetadata, utxoWithMetadataSchema } from "../types";
import {
  mempoolSpaceAddressBalanceSchema,
  mempoolSpaceAddressValidationSchema,
  mempoolSpaceFeesSchema,
  MempoolSpaceTransaction,
  mempoolSpaceTransactionSchema,
  mempoolSpaceUtxoSchema,
} from "./mempoolSpace.types";
// TODO Need to improve error handling

async function fetchTransaction(
  chainId: ChainId,
  transactionId: string
): Promise<FinalizedTransaction | null> {
  const explorerURL = getProviderUrls(chainId, ProviderType.mempoolspace)[0];
  const url = `${explorerURL}/tx/${transactionId}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    } else {
      console.warn(
        `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
        await response.text()
      );
      throw new ThirdPartyProviderError(
        `Error while fetching transaction with ID ${transactionId} from the explorer`
      );
    }
  }

  const result = await response.json();
  const data = mempoolSpaceTransactionSchema.parse(result);

  return await mempoolSpaceToAdamikTransaction(chainId, data);
}

async function fetchNativeTransaction(chainId: ChainId, transactionId: string): Promise<BitcoinTransaction> {
  const explorerURL = getProviderUrls(chainId, ProviderType.mempoolspace)[0];
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

async function fetchAddressUtxos(chainId: ChainId, address: string): Promise<UtxoWithMetadata[]> {
  const explorerURL = getProviderUrls(chainId, ProviderType.mempoolspace)[0];
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

  // Get script_hex for the address
  const scriptPubKey = await fetchAddressScriptPubKey(chainId, address);

  // Transform mempoolSpace format to UtxoWithMetadata format using the schema
  const transformedUtxos: UtxoWithMetadata[] = data.map((utxo) => {
    // Create object in the format expected by the Zod schema
    const utxoForSchema = {
      block_id: utxo.status.block_height ?? -1, // -1 for mempool transactions
      transaction_hash: utxo.txid,
      index: utxo.vout,
      value: utxo.value,
      address: address,
      script_hex: scriptPubKey,
    };

    // Parse through the schema to ensure proper typing
    return utxoWithMetadataSchema.parse(utxoForSchema);
  });

  return transformedUtxos;
}

async function fetchAddressData(chainId: ChainId, address: string): Promise<AccountState> {
  const explorerURL = getProviderUrls(chainId, ProviderType.mempoolspace)[0];
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

  // TODO Error management

  const data = mempoolSpaceAddressBalanceSchema.parse(result);

  const confirmedBalance = BigInt(data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum);

  // unconfirmed + mempool balance
  const unconfirmedBalance = BigInt(data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum);

  return {
    balances: {
      native: {
        available: confirmedBalance,
        unconfirmed: unconfirmedBalance,
        total: confirmedBalance + unconfirmedBalance,
      },
    },
  };
}

async function fetchAddressScriptPubKey(chainId: ChainId, address: string): Promise<string> {
  const explorerURL = getProviderUrls(chainId, ProviderType.mempoolspace)[0];
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

async function fetchFeePerByte(chainId: ChainId): Promise<{ slow: number; medium: number; fast: number }> {
  const explorerURL = getProviderUrls(chainId, ProviderType.mempoolspace)[0];
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

  return {
    slow: data.hourFee,
    medium: data.halfHourFee,
    fast: data.fastestFee,
  };
}

async function postTransaction(chainId: ChainId, payload: string): Promise<string> {
  const explorerURL = getProviderUrls(chainId, ProviderType.mempoolspace)[0];
  const url = `${explorerURL}/tx`;

  const response = await fetch(url, {
    method: "POST",
    body: payload,
  });

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
  const explorerURL = getProviderUrls(chainId, ProviderType.mempoolspace)[0];
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

  // Babylon Staking - poll the babylon backend to check whether it's a staking tx
  const babylonDelegationFound = await fetchBabylonDelegation(chainId, mempoolSpaceTransaction.txid);
  if (babylonDelegationFound) {
    // FIXME We can only identify 'staking' transactions,
    // found no way to identify 'unbonding' and 'withdrawal' transactions...
    parsedTransaction.mode = TransactionMode.STAKE;

    parsedTransaction.validators = {
      target: {
        address: babylonDelegationFound.data.finality_provider_btc_pks_hex[0],
        //amount: BigInt(mempoolSpaceTransaction.vout[0].value),
      },
    };
  }

  return {
    raw: mempoolSpaceTransaction,
    parsed: parsedTransaction,
  };
}

export {
  fetchAddressData,
  fetchAddressScriptPubKey,
  fetchAddressUtxos,
  fetchFeePerByte,
  fetchLatestBlockHeight,
  fetchNativeTransaction,
  fetchTransaction,
  postTransaction,
};
