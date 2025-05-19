import {
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
  MoveFunctionId,
  RawTransaction,
  SignedTransaction,
  TransactionAuthenticatorEd25519,
  U64,
} from "@aptos-labs/ts-sdk";
import { getClient } from "~/app/families/aptos/backend/node";
import { AptosTransactionParams } from "~/app/families/aptos/types";
import {
  EncodedTransactionFormat,
  StakeTransactionData,
  Status,
  Transaction,
  TransactionMode,
  TransferTokenTransactionData,
  UnstakeTransactionData,
} from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { AptosService } from "../service";

async function encodeTransactionToSign(
  this: AptosService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;
  const client = getClient(this.chainId);
  const params = ((mode: TransactionMode) => {
    switch (mode) {
      case TransactionMode.TRANSFER:
        return {
          payload: {
            function: "0x1::aptos_account::transfer" as MoveFunctionId,
            arguments: [transaction.data.recipientAddress, transaction.data.amount!.toString()],
          },
        };
      case TransactionMode.TRANSFER_TOKEN:
        return {
          payload: {
            function: "0x1::fungible_asset::transfer" as MoveFunctionId,
            arguments: [
              transaction.data.senderAddress,
              transaction.data.recipientAddress,
              transaction.data.amount!.toString(),
            ],
            type: "entry_function_payload",
            type_arguments: [(transaction.data as TransferTokenTransactionData).tokenId],
          },
        };
      case TransactionMode.STAKE:
        return {
          payload: {
            function: "0x1::delegation_pool::add_stake" as MoveFunctionId,
            arguments: [
              (transaction.data as StakeTransactionData).targetValidatorAddress,
              new U64(transaction.data.amount!),
            ],
          },
        };
      case TransactionMode.UNSTAKE: {
        return {
          payload: {
            function: "0x1::delegation_pool::unlock" as MoveFunctionId,
            arguments: [
              (transaction.data as UnstakeTransactionData).validatorAddress,
              new U64(transaction.data.amount!),
            ],
          },
        };
      }
      case TransactionMode.WITHDRAW: {
        return {
          payload: {
            function: "0x1::delegation_pool::withdraw" as MoveFunctionId,
            arguments: [
              (transaction.data as UnstakeTransactionData).validatorAddress,
              new U64(transaction.data.amount!),
            ],
          },
        };
      }
      default:
        throw new UnsupportedFeatureError(
          `Unsupported transaction mode ${transaction.data.mode} for chain ${this.chain.name}`
        );
    }
  })(transaction.data.mode);
  const tx = await client.transaction.build.simple({
    sender: transaction.data.senderAddress,
    data: {
      function: params.payload!.function,
      functionArguments: params.payload!.arguments,
      typeArguments: params.payload!.type_arguments,
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
