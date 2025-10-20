import { createMemoInstruction } from "@solana/spl-memo";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Authorized,
  Keypair,
  PublicKey,
  Transaction as SolanaTransaction,
  StakeProgram,
  SystemProgram,
} from "@solana/web3.js";
import { ChainId, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { env } from "~/env";
import { fetchAccountSPL, fetchLatestBlockhash } from "./backend/node";

const SOLANA_MIN_STAKE_AMOUNT = 10_000_000n;

// Mock keypair, used only in tests
const SOLANA_MOCK_KEYPAIR = {
  publicKey: new Uint8Array([
    232, 175, 126, 156, 17, 38, 161, 47, 42, 230, 40, 226, 216, 176, 100, 195, 87, 114, 226, 225, 134, 51,
    225, 24, 204, 18, 109, 221, 185, 224, 224, 120,
  ]),
  secretKey: new Uint8Array([
    104, 245, 107, 71, 199, 119, 81, 166, 159, 188, 124, 192, 15, 62, 133, 180, 196, 56, 88, 112, 159, 201,
    244, 189, 120, 165, 20, 25, 155, 237, 179, 37, 232, 175, 126, 156, 17, 38, 161, 47, 42, 230, 40, 226, 216,
    176, 100, 195, 87, 114, 226, 225, 134, 51, 225, 24, 204, 18, 109, 221, 185, 224, 224, 120,
  ]),
};

function isAddressValid(address: string) {
  try {
    return PublicKey.isOnCurve(address);
  } catch (error) {
    return false;
  }
}

async function buildTransferTransaction(
  chainId: ChainId,
  transaction: Transaction
): Promise<SolanaTransaction> {
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
  const blockhash = await fetchLatestBlockhash(chainId);

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

async function buildTokenTransferTransaction(
  chainId: ChainId,
  transaction: Transaction
): Promise<SolanaTransaction> {
  if (!transaction.data.amount) {
    throw new UserInputError("Amount is required");
  }

  if (transaction.data.mode !== TransactionMode.TRANSFER_TOKEN) {
    throw new UserInputError("Invalid transaction mode");
  }

  const senderPk = new PublicKey(transaction.data.senderAddress);
  const recipientPk = new PublicKey(transaction.data.recipientAddress);
  const tokenIdPk = new PublicKey(transaction.data.tokenId);
  const blockhash = await fetchLatestBlockhash(chainId);

  const recipientSolanaAccount = await fetchAccountSPL(chainId, recipientPk.toString());

  const tx = new SolanaTransaction();

  const senderTokenAccount = getAssociatedTokenAddressSync(tokenIdPk, senderPk);
  const recipientTokenAccount =
    recipientSolanaAccount && recipientSolanaAccount.owner.equals(TOKEN_PROGRAM_ID) // That means recipient is a token account
      ? recipientPk
      : getAssociatedTokenAddressSync(tokenIdPk, recipientPk);

  if (recipientTokenAccount.toBase58() !== recipientPk.toBase58()) {
    // We derive the token account address from the recipient address and check if it exists on Solana
    const tokenSolanaAccount = await fetchAccountSPL(chainId, recipientTokenAccount.toString());

    if (!tokenSolanaAccount) {
      // If token account doesn't exist, we create it
      tx.add(
        createAssociatedTokenAccountInstruction(senderPk, recipientTokenAccount, recipientPk, tokenIdPk)
      );
    }
  } else if (!recipientSolanaAccount) {
    // If recipient is a token account address, but doesn't exist on Solana, we create it
    tx.add(createAssociatedTokenAccountInstruction(senderPk, recipientTokenAccount, recipientPk, tokenIdPk));
  }

  tx.add(
    createTransferInstruction(senderTokenAccount, recipientTokenAccount, senderPk, transaction.data.amount)
  );

  tx.recentBlockhash = blockhash;
  tx.feePayer = senderPk;

  return tx;
}

async function buildStakeTransaction(chainId: ChainId, transaction: Transaction): Promise<SolanaTransaction> {
  if (transaction.data.mode !== TransactionMode.STAKE) {
    throw new UserInputError("Invalid transaction mode");
  }

  const senderPk = new PublicKey(transaction.data.senderAddress);

  // FIXME Hack to use mock keypair in tests, to prevent data from changing between tests
  const stakeAccountKeyPair = env.TEST_ENV ? new Keypair(SOLANA_MOCK_KEYPAIR) : Keypair.generate();

  const tx = new SolanaTransaction();
  const lamportsForStake = Number(transaction.data.amount);

  const createStakeAccountTx = StakeProgram.createAccount({
    fromPubkey: senderPk,
    stakePubkey: stakeAccountKeyPair.publicKey,
    authorized: new Authorized(senderPk, senderPk),
    lamports: lamportsForStake,
  });

  const delegateTx = StakeProgram.delegate({
    stakePubkey: stakeAccountKeyPair.publicKey,
    authorizedPubkey: senderPk,
    votePubkey: new PublicKey(transaction.data.targetValidatorAddress),
  });

  const blockhash = await fetchLatestBlockhash(chainId);

  tx.add(createStakeAccountTx).add(delegateTx);

  tx.recentBlockhash = blockhash;
  tx.feePayer = senderPk;

  tx.partialSign(stakeAccountKeyPair);

  return tx;
}

async function buildDeactivateStakeTransaction(
  chainId: ChainId,
  transaction: Transaction
): Promise<SolanaTransaction> {
  if (transaction.data.mode !== TransactionMode.UNSTAKE) {
    throw new UserInputError("Invalid transaction mode");
  }

  if (!transaction.data.stakeId) {
    throw new UserInputError("Stake ID is required");
  }

  const senderPk = new PublicKey(transaction.data.senderAddress);
  const stakeAccount = new PublicKey(transaction.data.stakeId);

  const tx = new SolanaTransaction();

  const deactivateTx = StakeProgram.deactivate({
    stakePubkey: stakeAccount,
    authorizedPubkey: senderPk,
  });

  const blockhash = await fetchLatestBlockhash(chainId);

  tx.add(deactivateTx);

  tx.recentBlockhash = blockhash;
  tx.feePayer = senderPk;

  return tx;
}

async function buildWithdrawStakeTransaction(
  chainId: ChainId,
  transaction: Transaction
): Promise<SolanaTransaction> {
  if (transaction.data.mode !== TransactionMode.WITHDRAW) {
    throw new UserInputError("Invalid transaction mode");
  }

  if (!transaction.data.stakeId) {
    throw new UserInputError("Stake ID is required");
  }

  const senderPk = new PublicKey(transaction.data.senderAddress);
  const stakeAccount = new PublicKey(transaction.data.stakeId);

  const tx = new SolanaTransaction();

  const withdrawTx = StakeProgram.withdraw({
    stakePubkey: stakeAccount,
    authorizedPubkey: senderPk,
    toPubkey: senderPk,
    lamports: Number(transaction.data.amount),
  });

  const blockhash = await fetchLatestBlockhash(chainId);

  tx.add(withdrawTx);

  tx.recentBlockhash = blockhash;
  tx.feePayer = senderPk;

  return tx;
}

export {
  buildDeactivateStakeTransaction,
  buildStakeTransaction,
  buildTokenTransferTransaction,
  buildTransferTransaction,
  buildWithdrawStakeTransaction,
  isAddressValid,
  SOLANA_MIN_STAKE_AMOUNT,
};
