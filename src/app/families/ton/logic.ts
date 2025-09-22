import { Address, beginCell, Builder, Cell, external, internal, storeMessage, toNano } from "@ton/core";
import { TransactionData, TransactionMode } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { fetchFees, getWalletJetonAddress } from "./backend/node";
import { fetchAccount } from "./backend/tonapi";
import { TON_BIT_PRICE, TON_CELL_PRICE, TON_IHR_PRICE_FACTOR, TON_LUMP_PRICE } from "./constants";
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

// https://docs.ton.org/develop/smart-contracts/fees#basic-fees-formula
async function computeEstimatedFees(transactionData: TransactionData, timeout: number) {
  const builtTransaction = (await buildTransaction(transactionData, timeout)).endCell();

  let initData;

  if (transactionData.nonce === 0n && transactionData.senderPubKey) {
    // TODO: do loop here to get wallet version
    initData = initWalletV4(transactionData.senderPubKey);
  }

  const allFees = await fetchFees(transactionData.senderAddress, builtTransaction, initData);

  const transactionFees =
    allFees.source_fees.fwd_fee +
    allFees.source_fees.gas_fee +
    allFees.source_fees.in_fwd_fee +
    allFees.source_fees.storage_fee;

  const fwdFees = allFees.source_fees.fwd_fee + allFees.source_fees.in_fwd_fee;

  const bit16 = 2 ** 16;

  const ihrFee = Math.ceil((fwdFees * TON_IHR_PRICE_FACTOR) / bit16);
  const importFee = TON_LUMP_PRICE + Math.ceil((TON_BIT_PRICE * 528 + TON_CELL_PRICE * 1) / bit16);
  const totalFees = transactionFees + ihrFee + importFee;

  // FIXME Actual fees always seem a bit higher than what we compute...
  // so we apply a safety coeff for now
  return BigInt(Math.ceil(totalFees * 1.2));
}

async function computeMaxSpendable(transactionData: TransactionData) {
  const account = await fetchAccount(transactionData.senderAddress);

  return account?.balance || 0n;
}

async function buildTransaction(transactionData: TransactionData, timeout: number): Promise<Builder> {
  // safe to cast as validation has already been done inside `completeTransaction`
  const amount = transactionData.amount as bigint;

  let messageBody;
  let toJettonAddress;
  if (transactionData.nonce === 0n && !transactionData.senderPubKey) {
    throw new UserInputError(
      "Public key of the sender address is required in order to initialize the wallet"
    );
  } else {
    if (transactionData.mode === TransactionMode.TRANSFER_TOKEN && transactionData.tokenId !== undefined) {
      const destinationAddress = Address.parse(transactionData.recipientAddress);

      toJettonAddress = await getWalletJetonAddress(transactionData.senderAddress, transactionData.tokenId);

      messageBody = beginCell()
        .storeUint(0x0f8a7ea5, 32) // opcode for jetton transfer
        .storeUint(0, 64) // query id
        .storeCoins(amount) // jetton amount, amount * 10^9
        .storeAddress(destinationAddress)
        .storeAddress(destinationAddress) // response destination
        .storeBit(0) // no custom payload
        .storeCoins(toNano("0.02")); // forward amount - if >0, will send notification message

      if (transactionData.memo) {
        const forwardPayload = beginCell()
          .storeUint(0, 32) // 0 opcode means we have a comment
          .storeStringTail(transactionData.memo)
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
      to: toJettonAddress ?? transactionData.recipientAddress,
      body: messageBody || transactionData.memo,
      init:
        transactionData.nonce === 0n && transactionData.senderPubKey
          ? initWalletV4(transactionData.senderPubKey)
          : undefined,
    });

    return createWalletTransferV4({
      seqno: Number(transactionData.nonce || 0),
      messages: [message],
      timeout,
    });
  }
}

function createExternalMessageBOC(
  address: Address,
  messageToSign: Builder,
  signature: Buffer,
  init?: { code: Cell; data: Cell }
) {
  const body = beginCell().storeBuffer(signature).storeBuilder(messageToSign).endCell();

  const externalMessage = external({
    to: address,
    body,
    init: init ?? null,
  });

  return beginCell().store(storeMessage(externalMessage)).endCell().toBoc().toString("base64");
}

export {
  buildTransaction,
  computeEstimatedFees,
  computeMaxSpendable,
  createExternalMessageBOC,
  isAddressValid,
};
