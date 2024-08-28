import { beginCell, Cell, MessageRelaxed, SendMode, storeMessageRelaxed } from "@ton/core";
import { Maybe } from "@ton/core/dist/utils/maybe";

export function initWalletV2(publicKey: string) {
  // https://github.com/ton-org/ton/blob/master/src/wallets/WalletContractV2R2.ts#L29
  let code = Cell.fromBoc(Buffer.from('te6cckEBAQEAYwAAwv8AIN0gggFMl7ohggEznLqxnHGw7UTQ0x/XC//jBOCk8mCDCNcYINMf0x8B+CO78mPtRNDTH9P/0VExuvKhA/kBVBBC+RDyovgAApMg10qW0wfUAvsA6NGkyMsfy//J7VQETNeh', 'base64'))[0];
  let data = beginCell()
    .storeUint(0, 32) // Seqno
    .storeBuffer(Buffer.from(publicKey, "hex"))
    .endCell();

  return { code, data };
}

export function createWalletTransferV2(
  args: {
    seqno: number;
    messages: MessageRelaxed[];
    sendMode?: Maybe<SendMode>;
    timeout?: Maybe<number>;
  }
) {
  let sendMode = args.sendMode ?? SendMode.PAY_GAS_SEPARATELY;

  if (args.messages.length > 4) {
    throw Error("Maximum number of messages in a single transfer is 4");
  }

  // Create message
  let signingMessage = beginCell()
    .storeUint(args.seqno, 32);
  if (args.seqno === 0) {
    for (let i = 0; i < 32; i++) {
      signingMessage.storeBit(1);
    }
  } else {
    signingMessage.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32); // Default timeout: 60 seconds
  }
  for (let m of args.messages) {
    signingMessage.storeUint(sendMode, 8);
    signingMessage.storeRef(beginCell().store(storeMessageRelaxed(m)));
  }

  return signingMessage;
}
