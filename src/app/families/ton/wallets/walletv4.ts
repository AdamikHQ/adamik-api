import { beginCell, Cell, MessageRelaxed, SendMode, storeMessageRelaxed } from "@ton/core";
import { Maybe } from "@ton/core/dist/utils/maybe";

// TODO: this file we need a rework in order to have an abstraction of multiple wallet versions
const WALLET_ID_V4 = 698983191;

export function initWalletV4(publicKey: string, workchain: number = 0) {
    // https://github.com/ton-org/ton/blob/master/src/wallets/WalletContractV4.ts#L48
    const code = Cell.fromBoc(
        Buffer.from(
            "te6ccgECFAEAAtQAART/APSkE/S88sgLAQIBIAIDAgFIBAUE+PKDCNcYINMf0x/THwL4I7vyZO1E0NMf0x/T//QE0VFDuvKhUVG68qIF+QFUEGT5EPKj+AAkpMjLH1JAyx9SMMv/UhD0AMntVPgPAdMHIcAAn2xRkyDXSpbTB9QC+wDoMOAhwAHjACHAAuMAAcADkTDjDQOkyMsfEssfy/8QERITAubQAdDTAyFxsJJfBOAi10nBIJJfBOAC0x8hghBwbHVnvSKCEGRzdHK9sJJfBeAD+kAwIPpEAcjKB8v/ydDtRNCBAUDXIfQEMFyBAQj0Cm+hMbOSXwfgBdM/yCWCEHBsdWe6kjgw4w0DghBkc3RyupJfBuMNBgcCASAICQB4AfoA9AQw+CdvIjBQCqEhvvLgUIIQcGx1Z4MesXCAGFAEywUmzxZY+gIZ9ADLaRfLH1Jgyz8gyYBA+wAGAIpQBIEBCPRZMO1E0IEBQNcgyAHPFvQAye1UAXKwjiOCEGRzdHKDHrFwgBhQBcsFUAPPFiP6AhPLassfyz/JgED7AJJfA+ICASAKCwBZvSQrb2omhAgKBrkPoCGEcNQICEekk30pkQzmkD6f+YN4EoAbeBAUiYcVnzGEAgFYDA0AEbjJftRNDXCx+AA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA4PABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AAG7SB/oA1NQi+QAFyMoHFcv/ydB3dIAYyMsFywIizxZQBfoCFMtrEszMyXP7AMhAFIEBCPRR8qcCAHCBAQjXGPoA0z/IVCBHgQEI9FHyp4IQbm90ZXB0gBjIywXLAlAGzxZQBPoCFMtqEssfyz/Jc/sAAgBsgQEI1xj6ANM/MFIkgQEI9Fnyp4IQZHN0cnB0gBjIywXLAlAFzxZQA/oCE8tqyx8Syz/Jc/sAAAr0AMntVA==",
            "base64"
        )
    )[0];

    const data = beginCell()
        .storeUint(0, 32) // Seqno
        .storeUint(WALLET_ID_V4 + workchain, 32)
        .storeBuffer(Buffer.from(publicKey, "hex"))
        .storeBit(0) // Empty plugins dict
        .endCell();

    return { code, data };
}

export function createWalletTransferV4(
    args: {
        seqno: number;
        messages: MessageRelaxed[];
        sendMode?: Maybe<SendMode>;
        timeout?: Maybe<number>;
    } & { sendMode?: number; walletId?: number },
    workchain: number = 0
) {
    // According to : https://github.com/ton-org/ton/blob/master/src/wallets/WalletContractV4.ts#L45
    const walletId = args.walletId ?? WALLET_ID_V4 + workchain;

    // Check number of messages
    if (args.messages.length > 4) {
        throw Error("Maximum number of messages in a single transfer is 4");
    }

    let signingMessage = beginCell().storeUint(walletId, 32);
    if (args.seqno === 0) {
        for (let i = 0; i < 32; i++) {
            signingMessage.storeBit(1);
        }
    } else {
        signingMessage.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32); // Default timeout: 60 seconds
    }
    signingMessage.storeUint(args.seqno, 32);
    signingMessage.storeUint(0, 8); // Simple order
    for (let m of args.messages) {
        signingMessage.storeUint(args.sendMode ?? SendMode.PAY_GAS_SEPARATELY, 8);
        signingMessage.storeRef(beginCell().store(storeMessageRelaxed(m)));
    }

    return signingMessage;
}
