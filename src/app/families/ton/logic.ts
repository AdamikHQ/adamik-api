import { Address, beginCell, Builder, Cell, external, internal, storeMessage, toNano } from "@ton/core";
import { randomBytes } from "crypto";
import { TransactionData, TransactionMode } from "~/app/model/types_WIP";
import { estimateFees, fetchAccount, getWalletJetonAddress } from "./backend/api";
import { TonTransactionParams } from "./types";
import { createWalletTransferV4, initWalletV4 } from "./wallets/walletv4";

const computeFees = async (transaction: TransactionData) => {
  const buildedTransaction = (await buildTransaction(transaction)).endCell();
  const transactionParams = transaction.params as TonTransactionParams;

  let initData;

  if (transaction.nonce === 0n && transactionParams && transactionParams.pubKey) {
    // TODO: do loop here to get wallet version
    initData = initWalletV4(transactionParams.pubKey);
  }

  const allFees = await estimateFees(transaction.sender, buildedTransaction, initData);

  // https://docs.ton.org/develop/smart-contracts/fees#basic-fees-formula
  const fees =
    allFees.source_fees.fwd_fee +
    allFees.source_fees.gas_fee +
    allFees.source_fees.in_fwd_fee +
    allFees.source_fees.storage_fee;

  return BigInt(fees);
};

const computeMaxSpendable = async (transaction: TransactionData) => {
  const account = await fetchAccount(transaction.sender);

  return account.balance;
};

function bigintRandom(bytes: number) {
  let value = BigInt(0);
  for (const randomNumber of randomBytes(bytes)) {
    const randomBigInt = BigInt(randomNumber);
    value = (value << BigInt(8)) + randomBigInt;
  }
  return value;
}

const buildTransaction = async (transaction: TransactionData) => {
  // safe to cast as validation has already been done inside `completeTransaction`
  const amount = transaction.amount as bigint;

  const transactionParams = transaction.params as TonTransactionParams;

  let messageBody;
  let toJettonAddress;
  if (transaction.nonce === 0n && transactionParams && !transactionParams.pubKey) {
    throw new Error("Missing wallet public key");
  } else {
    if (transaction.mode === TransactionMode.TRANSFER_TOKEN && transaction.tokenId !== undefined) {
      const destinationAddress = Address.parse(transaction.recipient);

      toJettonAddress = await getWalletJetonAddress(transaction.sender, transaction.tokenId);

      messageBody = beginCell()
        .storeUint(0x0f8a7ea5, 32) // opcode for jetton transfer
        .storeUint(0, 64) // query id
        .storeCoins(amount) // jetton amount, amount * 10^9
        .storeAddress(destinationAddress)
        .storeAddress(destinationAddress) // response destination
        .storeBit(0) // no custom payload
        .storeCoins(toNano("0.02")); // forward amount - if >0, will send notification message

      if (transaction.memo) {
        const forwardPayload = beginCell()
          .storeUint(0, 32) // 0 opcode means we have a comment
          .storeStringTail(transaction.memo)
          .endCell();
        messageBody = messageBody
          .storeBit(1) // we store forwardPayload as a reference
          .storeRef(forwardPayload);
      } else {
        messageBody = messageBody.storeBit(0); // no forward payload
      }

      messageBody = messageBody.endCell();
    }

    const message = internal({
      value: toJettonAddress ? toNano("0.1") : amount,
      to: toJettonAddress ?? transaction.recipient,
      body: messageBody || transaction.memo,
      bounce: true,
      init:
        transaction.nonce === BigInt(0) && transactionParams.pubKey
          ? initWalletV4(transactionParams.pubKey)
          : undefined,
    });
    return createWalletTransferV4({ seqno: Number(transaction.nonce || 0), messages: [message] });
  }
};

function packSignatureToFront(signature: Buffer, signingMessage: Builder): Cell {
  const body = beginCell().storeBuffer(signature).storeBuilder(signingMessage).endCell();

  return body;
}

const createExternalMessage = (address: string, body: Cell, init?: { code: Cell; data: Cell }) => {
  const externalMessage = external({
    to: address,
    body,
    init,
  });

  let boc = beginCell().store(storeMessage(externalMessage)).endCell().toBoc().toString("base64");

  return boc;
};

export { buildTransaction, computeFees, computeMaxSpendable, createExternalMessage, packSignatureToFront };
