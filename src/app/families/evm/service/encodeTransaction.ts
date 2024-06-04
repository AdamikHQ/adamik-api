import { encodeFunctionData, erc20Abi, toHex } from "viem";
import { Format, PlainTransaction, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { estimateFeesPerGas } from "../backend/node";
import { EvmService } from ".";
import { EvmAddress } from "../types";

async function encodeTransactionToSign(
  this: EvmService,
  transaction: PlainTransaction,
  format?: Format
): Promise<string> {
  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(this.chainId);

  if (transaction.mode === TransactionMode.TRANSFER_FUNGIBLE_TOKEN) {
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [transaction.recipients[0] as EvmAddress, transaction.amount],
    });

    return {
      maxPriorityFeePerGas: toHex(maxPriorityFeePerGas as bigint),
      maxFeePerGas: toHex(maxFeePerGas as bigint),
      from: transaction.senders[0],
      to: transaction.tokenId,
      data,
    } as any;
  } else {
    // FIXME: Parameters needed in specific Metamask format
    // Probably need to change function signature, if 'string' is not always the right return type
    // Or maybe build and use a raw transaction instead?
    // https://viem.sh/docs/utilities/serializeTransaction#serializetransaction
    // https://docs.metamask.io/wallet/reference/eth_sendrawtransaction/
    return {
      maxPriorityFeePerGas: toHex(maxPriorityFeePerGas as bigint),
      maxFeePerGas: toHex(maxFeePerGas as bigint),
      value: toHex(transaction.amount),
      //account: transaction.senders[0],
      from: transaction.senders[0],
      to: transaction.recipients[0],
    } as any;
  }
}

async function encodeTransactionToBroadcast(
  this: EvmService,
  signedTransaction: Transaction
): Promise<string> {
  if (!signedTransaction.encoded) {
    throw new Error("Missing encoded transaction");
  }
  if (!signedTransaction.signature) {
    throw new Error("Missing signature");
  }

  // TODO

  // Untestable at the moment since all supported EVM signers want to do the broadcast themselves
  // Code from Ledger Live, as a refence of what probably needs to be done

  /*
  const sig = (await signerContext(deviceId, signer => {
    signer.setLoadConfig(loadConfig);
    // Request signature on the nano
    return signer.clearSignTransaction(
      account.freshAddressPath,
      serializedTxHexString,
      resolutionConfig,
      true,
    );
  })) as EvmSignature;

  o.next({ type: "device-signature-granted" }); // Signature is done

  const { chainId = 0 } = account.currency.ethereumLikeInfo || {};
  // Create a new serialized tx with the signature now
  const signature = await getSerializedTransaction(preparedTransaction, {
    r: "0x" + sig.r,
    s: "0x" + sig.s,
    v: applyEIP155(typeof sig.v === "number" ? sig.v.toString(16) : sig.v, chainId),
  });
  */
  return signedTransaction.encoded;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
