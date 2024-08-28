import { beginCell, Cell, MessageRelaxed, SendMode, storeMessageRelaxed } from "@ton/core";
import { Maybe } from "@ton/core/dist/utils/maybe";

// Seems to be the same as V4
const WALLET_ID_V3 = 698983191;

export function initWalletV3(publicKey: string, workchain: number = 0) {
  const walletId = WALLET_ID_V3 + workchain;

  // https://github.com/ton-org/ton/blob/master/src/wallets/WalletContractV2R2.ts#L29
  let code = Cell.fromBoc(Buffer.from('te6cckEBAQEAcQAA3v8AIN0gggFMl7ohggEznLqxn3Gw7UTQ0x/THzHXC//jBOCk8mCDCNcYINMf0x/TH/gjE7vyY+1E0NMf0x/T/9FRMrryoVFEuvKiBPkBVBBV+RDyo/gAkyDXSpbTB9QC+wDo0QGkyMsfyx/L/8ntVBC9ba0=', 'base64'))[0];
  let data = beginCell()
    .storeUint(0, 32) // Seqno
    .storeUint(walletId, 32)
    .storeBuffer(Buffer.from(publicKey, "hex"))
    .endCell();

  return { code, data };
}

export function createWalletTransferV3(
  args: {
    seqno: number;
    messages: MessageRelaxed[];
    sendMode?: Maybe<SendMode>;
    timeout?: Maybe<number>;
  } & { sendMode?: number; walletId?: number },
  workchain: number = 0
) {
  if (args.messages.length > 4) {
    throw Error("Maximum number of messages in a single transfer is 4");
  }

  const sendMode = args.sendMode ?? SendMode.PAY_GAS_SEPARATELY;

  const walletId = args.walletId ?? WALLET_ID_V3 + workchain;

  // Create message to sign
  let signingMessage = beginCell()
    .storeUint(walletId, 32);
  if (args.seqno === 0) {
    for (let i = 0; i < 32; i++) {
      signingMessage.storeBit(1);
    }
  } else {
    signingMessage.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32); // Default timeout: 60 seconds
  }
  signingMessage.storeUint(args.seqno, 32);
  for (let m of args.messages) {
    signingMessage.storeUint(sendMode, 8);
    signingMessage.storeRef(beginCell().store(storeMessageRelaxed(m)));
  }

  return signingMessage;
}
