import { beginCell, Cell, MessageRelaxed, SendMode, storeMessageRelaxed } from "@ton/core";
import { Maybe } from "@ton/core/dist/utils/maybe";

export function initWalletV1(publicKey: string) {
  // https://github.com/ton-org/ton/blob/master/src/wallets/WalletContractV1R3.ts#L28
  let code = Cell.fromBoc(Buffer.from('te6cckEBAQEAXwAAuv8AIN0gggFMl7ohggEznLqxnHGw7UTQ0x/XC//jBOCk8mCBAgDXGCDXCx/tRNDTH9P/0VESuvKhIvkBVBBE+RDyovgAAdMfMSDXSpbTB9QC+wDe0aTIyx/L/8ntVLW4bkI=', 'base64'))[0];
  let data = beginCell()
    .storeUint(0, 32) // Seqno
    .storeBuffer(Buffer.from(publicKey, "hex"))
    .endCell();

  return { code, data };
}

export function createWalletTransferV1(
  args: {
    seqno: number;
    message: Maybe<MessageRelaxed>;
    sendMode?: Maybe<SendMode>;
    timeout?: Maybe<number>;
  }
) {
  let sendMode = args.sendMode ?? SendMode.PAY_GAS_SEPARATELY;

  // Create message
  let signingMessage = beginCell()
    .storeUint(args.seqno, 32);
  if (args.message) {
    signingMessage.storeUint(sendMode, 8);
    signingMessage.storeRef(beginCell().store(storeMessageRelaxed(args.message)));
  }

  return signingMessage;
}
