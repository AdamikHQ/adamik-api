import { Message, PublicKey, Transaction as SolanaTransaction } from "@solana/web3.js";
import { encodeBase58 } from "ethers";
import {
  EncodedTransactionFormat,
  HashFunction,
  Status,
  Transaction,
  TransactionMode,
} from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { sha256 } from "~/app/tools/hash";
import {
  buildDeactivateStake,
  buildTokenTransferTransaction,
  buildTransactionStake,
  buildTransferTransaction,
  buildWithdrawStake,
} from "../logic";
import { SolanaService } from "../service";
import type { SolanaTransactionParams } from "../types";

async function encodeTransaction(this: SolanaService, _: { transaction: Transaction; status: Status }) {
  const { transaction } = _;

  let borshTransaction = "";
  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      borshTransaction = (await buildTransferTransaction(transaction)).serializeMessage().toString("hex");
      break;
    case TransactionMode.TRANSFER_TOKEN:
      borshTransaction = (await buildTokenTransferTransaction(transaction))
        .serializeMessage()
        .toString("hex");
      break;
    case TransactionMode.STAKE:
      // how stake works on solana : https://solana.com/fr/staking#how-do-i-add-tokens-to-a-stake-account
      const txStake = await buildTransactionStake(transaction);
      borshTransaction = txStake.serializeMessage().toString("hex");
      const stakeAccountSignature = txStake.signatures.find(
        (signature) => signature.publicKey.toBase58() !== transaction.data.senderAddress
      );

      if (!stakeAccountSignature) {
        throw new UserInputError("Stake account signature not found");
      }

      transaction.data.params = {
        signature: stakeAccountSignature.signature?.toString("hex") ?? "",
        publicKey: stakeAccountSignature.publicKey.toString(),
      };

      break;
    case TransactionMode.UNSTAKE:
      const txUnstake = await buildDeactivateStake(transaction);
      borshTransaction = txUnstake.serializeMessage().toString("hex");
      break;

    case TransactionMode.WITHDRAW:
      const txWithdraw = await buildWithdrawStake(transaction);
      borshTransaction = txWithdraw.serializeMessage().toString("hex");
      break;
    default:
      throw new UserInputError("Invalid transaction mode");
  }

  transaction.encoded = [
    {
      raw: {
        // https://solana.com/fr/developers/courses/native-onchain-development/serialize-instruction-data-frontend
        // from Documentation : "To pass instruction data from a client, it must be serialized into a byte buffer. To facilitate this process of serialization, we will be using Borsh."
        format: EncodedTransactionFormat.BORSH,
        value: borshTransaction,
      },
      hash: {
        format: HashFunction.SHA256,
        value: sha256(Buffer.from(borshTransaction, "hex")),
      },
    },
  ];
}

async function encodeTransactionToBroadcast(
  this: SolanaService,
  _: { signedTransaction: Transaction; status: Status }
) {
  const { signedTransaction } = _;

  if (!signedTransaction.encoded) {
    throw new UserInputError("Can't find encoded transaction");
  }

  if (!signedTransaction.signature) {
    throw new UserInputError("Can't find transaction signature");
  }

  const borshTransaction = signedTransaction?.encoded.find(
    (encoded) => encoded.raw?.format === EncodedTransactionFormat.BORSH
  )?.raw?.value;

  if (!borshTransaction) {
    throw new UserInputError("Can't find encoded transaction");
  }

  const recoverTransaction = SolanaTransaction.populate(Message.from(Buffer.from(borshTransaction, "hex")), [
    encodeBase58(Buffer.from(signedTransaction.signature, "hex")),
  ]);

  recoverTransaction.addSignature(
    new PublicKey(signedTransaction.data.senderAddress),
    Buffer.from(signedTransaction.signature, "hex")
  );

  const params: SolanaTransactionParams | undefined = signedTransaction.data.params;

  if (signedTransaction.data.mode === TransactionMode.STAKE && params) {
    const solanaParams: { publicKey: string; signature: string } = params;

    recoverTransaction.addSignature(
      new PublicKey(solanaParams.publicKey),
      Buffer.from(solanaParams.signature, "hex")
    );
  }

  return recoverTransaction.serialize().toString("hex");
}

export { encodeTransaction, encodeTransactionToBroadcast };
