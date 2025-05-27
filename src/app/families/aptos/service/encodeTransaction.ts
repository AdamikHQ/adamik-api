import {
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
  InputEntryFunctionData,
  MoveFunctionId,
  RawTransaction,
  SignedTransaction,
  TransactionAuthenticatorEd25519,
  U64,
} from "@aptos-labs/ts-sdk";
import { getClient } from "~/app/families/aptos/backend/node";
import { AptosTransactionParams } from "~/app/families/aptos/types";
import { EncodedTransactionFormat, Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { AptosService } from "../service";
import { DEFAULT_TXN_EXP_SEC_FROM_NOW } from "~/app/families/aptos/constants";

async function encodeTransactionToSign(
  this: AptosService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;
  const client = getClient(this.chainId);
  const data: InputEntryFunctionData = (() => {
    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER:
        return {
          function: "0x1::aptos_account::transfer" as MoveFunctionId,
          functionArguments: [transaction.data.recipientAddress, transaction.data.amount!.toString()],
        };
      case TransactionMode.TRANSFER_TOKEN:
        return {
          function: "0x1::fungible_asset::transfer" as MoveFunctionId,
          functionArguments: [
            transaction.data.senderAddress,
            transaction.data.recipientAddress,
            transaction.data.amount!.toString(),
          ],
          type: "entry_function_payload",
          typeArguments: [transaction.data.tokenId],
        };
      case TransactionMode.STAKE:
        return {
          function: "0x1::delegation_pool::add_stake" as MoveFunctionId,
          functionArguments: [transaction.data.targetValidatorAddress, new U64(transaction.data.amount!)],
        };
      case TransactionMode.UNSTAKE: {
        return {
          function: "0x1::delegation_pool::unlock" as MoveFunctionId,
          functionArguments: [transaction.data.validatorAddress, new U64(transaction.data.amount!)],
        };
      }
      case TransactionMode.WITHDRAW: {
        return {
          function: "0x1::delegation_pool::withdraw" as MoveFunctionId,
          functionArguments: [transaction.data.validatorAddress, new U64(transaction.data.amount!)],
        };
      }
      default:
        throw new UnsupportedFeatureError(
          `Unsupported transaction mode ${transaction.data.mode} for chain ${this.chain.name}`
        );
    }
  })();
  const tx = await client.transaction.build.simple({
    sender: transaction.data.senderAddress,
    data,
    options: {
      expireTimestamp: Math.floor(Date.now() / 1000) + DEFAULT_TXN_EXP_SEC_FROM_NOW,
    },
  });
  const signingMessage = generateSigningMessageForTransaction(tx);
  transaction.encoded = [
    {
      // https://aptos.dev/en/build/sdks/ts-sdk/building-transactions/bcs-format
      raw: { value: Buffer.from(signingMessage).toString("hex"), format: EncodedTransactionFormat.BCS },
    },
  ];

  transaction.data.params = {
    rawTransaction: tx.rawTransaction.toString().slice(2),
  };
}

async function encodeTransactionToBroadcast(
  this: AptosService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;
  const params = signedTransaction.data.params as AptosTransactionParams;
  const rawTxHex = params.rawTransaction!;
  const deserializer = new Deserializer(Buffer.from(rawTxHex, "hex"));

  const publicKey = new Ed25519PublicKey(signedTransaction.data.senderPubKey!);
  const signature = Buffer.from(signedTransaction.signature!, "hex");
  const authenticator = new TransactionAuthenticatorEd25519(publicKey, new Ed25519Signature(signature));
  const rawTransaction = RawTransaction.deserialize(deserializer);

  const signedTx = new SignedTransaction(rawTransaction, authenticator);
  return Buffer.from(signedTx.bcsToBytes()).toString("hex");
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
