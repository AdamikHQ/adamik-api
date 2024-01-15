import { BigNumber } from "bignumber.js";
import { bech32 } from "bech32";
import { PubKey } from "cosmjs-types/cosmos/crypto/secp256k1/keys";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { AuthInfo, TxRaw, TxBody, Fee } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Secp256k1Signature } from "@cosmjs/crypto";
import { AminoMsg, StdSignDoc, makeSignDoc, serializeSignDoc } from "@cosmjs/amino";
import {
  AminoMsgSend,
  /*
  AminoMsgDelegate,
  AminoMsgUndelegate,
  AminoMsgBeginRedelegate,
  AminoMsgWithdrawDelegatorReward,
  */
} from "@cosmjs/stargate";
import { EncodeObject as ProtoMsg } from "@cosmjs/proto-signing";
import { MsgSend as ProtoMsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
//import { MsgDelegate, MsgUndelegate, MsgBeginRedelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";

import { ChainId, PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { fetchAccount, fetchChainId, simulateTransaction } from "./backend/node";
import { COSMOS_PARAMS, COSMOS_GAS_AMPLIFIER, COSMOS_MOCK_PUBKEY } from "./constants";

// TODO Keep this file as a fourre-tout or split it?

function isValidAddress(address: string) {
  // FIXME Take this as function param instead
  const chainId = ChainId.COSMOS;

  try {
    bech32.decode(address);
  } catch (e) {
    return false;
  }

  const prefix = COSMOS_PARAMS.get(chainId)?.prefix;
  if (!prefix || !address.startsWith(prefix)) {
    return false;
  }

  return true;
}

async function getEstimatedFees(transaction: PlainTransaction): Promise<{
  gasWanted: bigint;
  gasWantedFees: bigint;
}> {
  const chainParams = COSMOS_PARAMS.get(transaction.chain);
  if (!chainParams) {
    throw new Error(`Unsupported chain: ${transaction.chain}`);
  }

  const { protoMsgs } = getMessages(transaction);
  const { sequence, pubKeyType, pubKey } = await fetchAccount(transaction.senders[0]);
  const dummySignature = new Uint8Array(Buffer.from(COSMOS_MOCK_PUBKEY, "hex"));

  const txBytes = buildBroadcastPayload({
    protoMsgs,
    memo: transaction.memo || "",
    pubKeyType,
    pubKey,
    feeAmount: undefined,
    gasLimit: undefined,
    sequence,
    signature: dummySignature,
  });

  const gasUsed = await (async (): Promise<bigint> => {
    try {
      const payload = JSON.stringify({
        tx_bytes: Array.from(txBytes),
      });
      return await simulateTransaction(payload);
    } catch (e) {
      console.log("Failed to estimate gas usage during tx simulation. Error:", e);
    }

    // TODO Proper CAL, to support more than ATOM
    return BigInt(chainParams.defaultGas);
  })();

  // Need to use the BigNumber lib to multiply bigints and floats...
  const gasWanted = new BigNumber(gasUsed.toString())
    .times(COSMOS_GAS_AMPLIFIER)
    .integerValue(BigNumber.ROUND_CEIL);
  const gasWantedFees = gasWanted.times(chainParams.minGasPrice).integerValue(BigNumber.ROUND_CEIL);

  return { gasWanted: BigInt(gasWanted.toFixed()), gasWantedFees: BigInt(gasWantedFees.toFixed()) };
}

function getMessages(transaction: PlainTransaction): { aminoMsgs: AminoMsg[]; protoMsgs: ProtoMsg[] } {
  const aminoMsgs: Array<AminoMsg> = [];
  const protoMsgs: Array<ProtoMsg> = [];
  switch (transaction.mode) {
    case "transfer":
      if (transaction.recipients[0] && transaction.amount > 0n) {
        const aminoMsg: AminoMsgSend = {
          type: "cosmos-sdk/MsgSend",
          value: {
            from_address: transaction.senders[0],
            to_address: transaction.recipients[0],
            amount: [
              {
                denom: "uatom", // FIXME Need CAL
                amount: transaction.amount.toString(),
              },
            ],
          },
        };
        aminoMsgs.push(aminoMsg);

        // PROTO MESSAGE
        const protoMsg = {
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: ProtoMsgSend.encode({
            fromAddress: transaction.senders[0],
            toAddress: transaction.recipients[0],
            amount: [
              {
                denom: "uatom", // FIXME Need CAL
                amount: transaction.amount.toString(),
              },
            ],
          }).finish(),
        };
        protoMsgs.push(protoMsg);
      }
      break;
    /*
    case "delegate":
      if (transaction.validators && transaction.validators.length > 0) {
        const validator = transaction.validators[0];
        if (validator && validator.address && transaction.amount.gt(0)) {
          const aminoMsg: AminoMsgDelegate = {
            type: "cosmos-sdk/MsgDelegate",
            value: {
              delegator_address: account.freshAddress,
              validator_address: validator.address,
              amount: {
                denom: account.currency.units[1].code,
                amount: transaction.amount.toFixed(),
              },
            },
          };
          aminoMsgs.push(aminoMsg);

          // PROTO MESSAGE
          protoMsgs.push({
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: MsgDelegate.encode({
              delegatorAddress: account.freshAddress,
              validatorAddress: validator.address,
              amount: {
                denom: account.currency.units[1].code,
                amount: transaction.amount.toFixed(),
              },
            }).finish(),
          });
        }
      }
      break;

    case "redelegate":
      if (
        transaction.sourceValidator &&
        transaction.validators &&
        transaction.validators.length > 0 &&
        transaction.validators[0].address &&
        transaction.validators[0].amount.gt(0)
      ) {
        const validator = transaction.validators[0];
        const aminoMsg: AminoMsgBeginRedelegate = {
          type: "cosmos-sdk/MsgBeginRedelegate",
          value: {
            delegator_address: account.freshAddress,
            validator_src_address: transaction.sourceValidator,
            validator_dst_address: validator.address,
            amount: {
              denom: account.currency.units[1].code,
              amount: validator.amount.toFixed(),
            },
          },
        };
        aminoMsgs.push(aminoMsg);

        // PROTO MESSAGE
        protoMsgs.push({
          typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
          value: MsgBeginRedelegate.encode({
            delegatorAddress: account.freshAddress,
            validatorSrcAddress: transaction.sourceValidator,
            validatorDstAddress: validator.address,
            amount: {
              denom: account.currency.units[1].code,
              amount: validator.amount.toFixed(),
            },
          }).finish(),
        });
      }
      break;

    case "undelegate":
      if (transaction.validators && transaction.validators.length > 0) {
        const validator = transaction.validators[0];
        if (validator && validator.address && validator.amount.gt(0)) {
          const aminoMsg: AminoMsgUndelegate = {
            type: "cosmos-sdk/MsgUndelegate",
            value: {
              delegator_address: account.freshAddress,
              validator_address: validator.address,
              amount: {
                denom: account.currency.units[1].code,
                amount: validator.amount.toFixed(),
              },
            },
          };
          aminoMsgs.push(aminoMsg);

          // PROTO MESSAGE
          protoMsgs.push({
            typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
            value: MsgUndelegate.encode({
              delegatorAddress: account.freshAddress,
              validatorAddress: validator.address,
              amount: {
                denom: account.currency.units[1].code,
                amount: validator.amount.toFixed(),
              },
            }).finish(),
          });
        }
      }
      break;
    case "claimReward":
      if (transaction.validators && transaction.validators.length > 0 && transaction.validators[0].address) {
        const validator = transaction.validators[0];
        const aminoMsg: AminoMsgWithdrawDelegatorReward = {
          type: "cosmos-sdk/MsgWithdrawDelegationReward",
          value: {
            delegator_address: account.freshAddress,
            validator_address: validator.address,
          },
        };
        aminoMsgs.push(aminoMsg);

        // PROTO MESSAGE
        protoMsgs.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: MsgWithdrawDelegatorReward.encode({
            delegatorAddress: account.freshAddress,
            validatorAddress: validator.address,
          }).finish(),
        });
      }
      break;
    case "claimRewardCompound":
      if (
        transaction.validators &&
        transaction.validators.length > 0 &&
        transaction.validators[0].address &&
        transaction.validators[0].amount.gt(0)
      ) {
        const validator = transaction.validators[0];
        // AMINO MESSAGES
        const aminoWithdrawRewardMsg: AminoMsgWithdrawDelegatorReward = {
          type: "cosmos-sdk/MsgWithdrawDelegationReward",
          value: {
            delegator_address: account.freshAddress,
            validator_address: validator.address,
          },
        };
        const aminoDelegateMsg: AminoMsgDelegate = {
          type: "cosmos-sdk/MsgDelegate",
          value: {
            delegator_address: account.freshAddress,
            validator_address: validator.address,
            amount: {
              denom: account.currency.units[1].code,
              amount: validator.amount.toFixed(),
            },
          },
        };
        aminoMsgs.push(aminoWithdrawRewardMsg, aminoDelegateMsg);

        // PROTO MESSAGES
        protoMsgs.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: MsgWithdrawDelegatorReward.encode({
            delegatorAddress: account.freshAddress,
            validatorAddress: validator.address,
          }).finish(),
        });
        protoMsgs.push({
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: MsgDelegate.encode({
            delegatorAddress: account.freshAddress,
            validatorAddress: validator.address,
            amount: {
              denom: account.currency.units[1].code,
              amount: validator.amount.toFixed(),
            },
          }).finish(),
        });
      }
      break;
      */
  }
  return { aminoMsgs, protoMsgs };
}

async function buildSignPayload(transaction: PlainTransaction): Promise<StdSignDoc> {
  if (!transaction.fees) {
    throw new Error("Transaction lacks fees information");
  } else if (!transaction.gas) {
    throw new Error("Transaction lacks gas information");
  }

  const feeToEncode = {
    amount: [
      {
        denom: "uatom", // TODO CAL + family
        amount: transaction.fees.toString(),
      },
    ],
    gas: transaction.gas.toString(),
  };

  const { aminoMsgs } = getMessages(transaction);
  const chainId = await fetchChainId();
  const { accountNumber, sequence } = await fetchAccount(transaction.senders[0]);

  return makeSignDoc(
    aminoMsgs,
    feeToEncode,
    chainId,
    transaction.memo || "",
    accountNumber.toString(),
    sequence.toString()
  );
}

function buildBroadcastPayload({
  protoMsgs,
  memo,
  pubKeyType,
  pubKey,
  feeAmount,
  gasLimit,
  sequence,
  signature,
}: {
  protoMsgs: Array<ProtoMsg>;
  memo: string;
  pubKeyType: string;
  pubKey: string;
  feeAmount: { amount: bigint; denom: string } | undefined;
  gasLimit: bigint | undefined;
  sequence: bigint;
  signature: Uint8Array;
}): Uint8Array {
  const signedTx = TxRaw.encode({
    bodyBytes: TxBody.encode(
      TxBody.fromPartial({
        messages: protoMsgs,
        memo,
        timeoutHeight: undefined,
        extensionOptions: [],
        nonCriticalExtensionOptions: [],
      })
    ).finish(),
    authInfoBytes: AuthInfo.encode({
      signerInfos: [
        {
          publicKey: {
            typeUrl: pubKeyType,
            value: PubKey.encode({
              key: Buffer.from(pubKey, "base64"),
            }).finish(),
          },
          modeInfo: {
            single: {
              mode: SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
            },
            multi: undefined,
          },
          sequence: sequence,
        },
      ],
      fee: Fee.fromPartial({
        amount: feeAmount as any,
        gasLimit: gasLimit,
      }),
    }).finish(),
    signatures: [signature],
  }).finish();

  return signedTx;
}

async function encodeToSign(transaction: PlainTransaction): Promise<string> {
  // NOTE Providing payload for an Amino signer (like Ledger)
  // Need to provide payload for Protobuf signer as well?...
  const signDoc = await buildSignPayload(transaction);

  return Buffer.from(serializeSignDoc(signDoc)).toString("hex");
}

async function encodeToBroadcast(signedTransaction: Transaction): Promise<string> {
  if (!signedTransaction.signature) {
    throw new Error("Transaction lacks signature");
  }

  const signature = Buffer.from(
    Secp256k1Signature.fromDer(Buffer.from(signedTransaction.signature, "hex")).toFixedLength()
  );

  const plainTransation = signedTransaction.plain;

  const { protoMsgs } = getMessages(plainTransation);
  const { pubKeyType, pubKey } = await fetchAccount(plainTransation.senders[0]);
  const signDoc = await buildSignPayload(plainTransation);

  const txBytes = buildBroadcastPayload({
    protoMsgs,
    memo: plainTransation.memo || "",
    pubKeyType,
    pubKey,
    feeAmount: signDoc.fee.amount as any,
    gasLimit: BigInt(signDoc.fee.gas),
    sequence: BigInt(signDoc.sequence),
    signature,
  });

  return Buffer.from(txBytes).toString("hex");
}

export { isValidAddress, getEstimatedFees, encodeToSign, encodeToBroadcast };
