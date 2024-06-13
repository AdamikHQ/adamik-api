import { encodeFunctionData, erc20Abi, toHex, BaseError as ViemError } from "viem";
import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { estimateFeesPerGas } from "../backend/node";
import { EvmService } from ".";
import { EvmAddress, EvmParams } from "../types";
import { CHAINS } from "~/app/config/chains";
import { serializeTransaction } from "viem/op-stack";

async function encodeTransactionToSign(this: EvmService, transaction: Transaction): Promise<void> {
  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(this.chainId);

  //*
  try {
    switch (transaction.plain.mode) {
      case TransactionMode.TRANSFER: {
        // FIXME: Parameters for specific Metamask format
        // Should change function signature, if 'string' is not always the right return type
        transaction.encoded = {
          maxPriorityFeePerGas: toHex(maxPriorityFeePerGas as bigint),
          maxFeePerGas: toHex(maxFeePerGas as bigint),
          value: toHex(transaction.plain.amount),
          from: transaction.plain.senders[0],
          to: transaction.plain.recipients[0],
        } as any;
        break;
      }
      case TransactionMode.TRANSFER_TOKEN: {
        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [transaction.plain.recipients[0] as EvmAddress, transaction.plain.amount],
        });

        transaction.encoded = {
          maxPriorityFeePerGas: toHex(maxPriorityFeePerGas as bigint),
          maxFeePerGas: toHex(maxFeePerGas as bigint),
          from: transaction.plain.senders[0],
          to: transaction.plain.tokenId,
          data,
        } as any;
        break;
      }
      default:
        throw new Error(
          `Unsupported transaction mode ${transaction.plain.mode} for chain ID ${transaction.plain.chainId}`
        );
    }
  } catch (e: any) {
    const message =
      (e instanceof ViemError ? e.shortMessage : e.message) || "Failed to encode the transaction";
    transaction.status.errors.push({ message });
  }

  // TODO Maybe build and use a raw transaction instead?
  // ⚠️ Must check that Metamask doesn't blind sign when doing this
  // https://viem.sh/op-stack/utilities/serializeTransaction
  // https://docs.metamask.io/wallet/reference/eth_sendrawtransaction/
  /*/
  const chainParams = CHAINS[this.chainId].params as EvmParams;
  const data =
    transaction.plain.mode === TransactionMode.TRANSFER_TOKEN
      ? encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [transaction.plain.recipients[0] as EvmAddress, transaction.plain.amount],
        })
      : undefined;

  const recipient =
    transaction.plain.mode === TransactionMode.TRANSFER_TOKEN
      ? (transaction.plain.tokenId as EvmAddress)
      : (transaction.plain.recipients[0] as EvmAddress);

  transaction.encoded = serializeTransaction({
    chainId: chainParams.evmChainId,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas: transaction.plain.gas,
    nonce: transaction.plain.nonce,
    to: recipient,
    value: transaction.plain.amount,
    data,
  });
  //*/
}

async function encodeTransactionToBroadcast(
  this: EvmService,
  signedTransaction: Transaction
): Promise<string> {
  try {
    if (!signedTransaction.encoded) {
      throw new Error("missing encoded transaction");
    }
    if (!signedTransaction.signature) {
      throw new Error("missing transaction signature");
    }

    // TODO

    // Untestable at the moment since all supported EVM signers want to do the broadcast themselves
    // Code from Ledger Live, as a reference of what probably needs to be done

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
  } catch (e: any) {
    signedTransaction.status.errors.push({ message: `Error while encoding to broadcast: ${e.message}` });
    return "";
  }
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
