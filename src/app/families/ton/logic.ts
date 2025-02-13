import { Address, beginCell, Builder, Cell, external, internal, storeMessage, toNano } from "@ton/core";
import { TransactionData, TransactionMode } from "~/app/model/types_WIP";
import { estimateFees, getWalletJetonAddress } from "./backend/node";
import { fetchAccount } from "./backend/tonapi";
import { createWalletTransferV4, initWalletV4 } from "./wallets/walletv4";

// Found this source but not sure it's 100% efficient
// https://answers.ton.org/question/1534294957110595584/what-is-a-regular-expression-to-check-ton-addresses
async function isAddressValid(address: string): Promise<boolean> {
  try {
    Address.parse(address);
    return true;
  } catch (e) {
    return false;
  }
}

async function computeFees(transaction: TransactionData) {
  const builtTransaction = (await buildTransaction(transaction)).endCell();

  let initData;

  if (transaction.nonce === 0n && transaction.senderPubKey) {
    // TODO: do loop here to get wallet version
    initData = initWalletV4(transaction.senderPubKey);
  }

  const allFees = await estimateFees(transaction.senderAddress, builtTransaction, initData);

  // https://docs.ton.org/develop/smart-contracts/fees#basic-fees-formula
  const fees =
    allFees.source_fees.fwd_fee +
    allFees.source_fees.gas_fee +
    allFees.source_fees.in_fwd_fee +
    allFees.source_fees.storage_fee;

  return BigInt(fees);
}

async function computeMaxSpendable(transaction: TransactionData) {
  const account = await fetchAccount(transaction.senderAddress);

  return account?.balance || 0n;
}

async function buildTransaction(transaction: TransactionData, timeoutTimestamp?: number) {
  // safe to cast as validation has already been done inside `completeTransaction`
  const amount = transaction.amount as bigint;

  let messageBody;
  let toJettonAddress;
  if (transaction.nonce === 0n && !transaction.senderPubKey) {
    // FIXME Should be done in validateTransaction instead
    throw new Error("Missing wallet public key");
  } else {
    if (transaction.mode === TransactionMode.TRANSFER_TOKEN && transaction.tokenId !== undefined) {
      const destinationAddress = Address.parse(transaction.recipientAddress);

      toJettonAddress = await getWalletJetonAddress(transaction.senderAddress, transaction.tokenId);

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
      to: toJettonAddress ?? transaction.recipientAddress,
      body: messageBody || transaction.memo,
      init:
        transaction.nonce === BigInt(0) && transaction.senderPubKey
          ? initWalletV4(transaction.senderPubKey)
          : undefined,
    });
    return createWalletTransferV4({
      seqno: Number(transaction.nonce || 0),
      messages: [message],
      timeout: timeoutTimestamp,
    });
  }
}

function packSignatureToFront(signature: Buffer, signingMessage: Builder): Cell {
  const body = beginCell().storeBuffer(signature).storeBuilder(signingMessage).endCell();

  return body;
}

function createExternalMessage(address: Address, body: Cell, init?: { code: Cell; data: Cell }) {
  const externalMessage = external({
    to: address,
    body,
    init: init ?? null,
  });

  let boc = beginCell().store(storeMessage(externalMessage)).endCell().toBoc().toString("base64");

  return boc;
}

export {
  buildTransaction,
  computeFees,
  computeMaxSpendable,
  createExternalMessage,
  isAddressValid,
  packSignatureToFront,
};
