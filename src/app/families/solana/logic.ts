import { createMemoInstruction } from "@solana/spl-memo";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, Transaction as SolanaTransaction, SystemProgram } from "@solana/web3.js";
import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { fetchAccountSPL, fetchLatestBlockhash } from "./backend/node";

async function buildTransferTransaction(transaction: Transaction): Promise<SolanaTransaction> {
  if (transaction.data.mode !== TransactionMode.TRANSFER) {
    throw new UserInputError("Invalid transaction mode");
  }

  const senderAddress = transaction.data.senderAddress;
  const recipientAddress = transaction.data.recipientAddress;
  const amount = transaction.data.amount;

  if (!senderAddress || !recipientAddress || !amount) {
    throw new Error("Invalid transaction data");
  }

  const senderPubkey = new PublicKey(senderAddress);
  const recipientPubkey = new PublicKey(recipientAddress);
  const blockhash = await fetchLatestBlockhash();

  const tx = new SolanaTransaction().add(
    SystemProgram.transfer({
      fromPubkey: senderPubkey,
      toPubkey: recipientPubkey,
      lamports: amount,
    })
  );
  tx.recentBlockhash = blockhash;
  tx.feePayer = senderPubkey;

  if (transaction.data.memo) {
    // Create a memo instruction
    const memoInstruction = createMemoInstruction(transaction.data.memo);
    tx.add(memoInstruction);
  }

  return tx;
}

async function buildTokenTransferTransaction(transaction: Transaction): Promise<SolanaTransaction> {
  if (!transaction.data.amount) {
    throw new UserInputError("Amount is required");
  }

  if (transaction.data.mode !== TransactionMode.TRANSFER_TOKEN) {
    throw new UserInputError("Invalid transaction mode");
  }

  const senderPk = new PublicKey(transaction.data.senderAddress);
  const recipientPk = new PublicKey(transaction.data.recipientAddress);
  const tokenIdPk = new PublicKey(transaction.data.tokenId);
  const blockhash = await fetchLatestBlockhash();

  const recipientSolanaAccount = await fetchAccountSPL(recipientPk.toString());

  const tx = new SolanaTransaction();

  const senderTokenAccount = getAssociatedTokenAddressSync(tokenIdPk, senderPk);
  const recipientTokenAccount =
    recipientSolanaAccount && recipientSolanaAccount.owner.equals(TOKEN_PROGRAM_ID) // That means recipient is a token account
      ? recipientPk
      : getAssociatedTokenAddressSync(tokenIdPk, recipientPk);

  if (!recipientSolanaAccount) {
    tx.add(createAssociatedTokenAccountInstruction(senderPk, recipientTokenAccount, recipientPk, tokenIdPk));
  }

  tx.add(
    createTransferInstruction(senderTokenAccount, recipientTokenAccount, senderPk, transaction.data.amount)
  );

  tx.recentBlockhash = blockhash;
  tx.feePayer = senderPk;

  return tx;
}

export { buildTokenTransferTransaction, buildTransferTransaction };
