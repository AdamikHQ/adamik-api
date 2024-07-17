import { BigNumber } from "bignumber.js";
import { bech32 } from "bech32";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import { PubKey } from "cosmjs-types/cosmos/crypto/secp256k1/keys";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { AuthInfo, TxRaw, TxBody, Fee } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Secp256k1Signature } from "@cosmjs/crypto";
import { fromBase64 } from "@cosmjs/encoding";
import { AminoMsg, StdSignDoc, makeSignDoc, serializeSignDoc } from "@cosmjs/amino";
import {
  AminoMsgDelegate,
  AminoMsgSend,
  /*
  AminoMsgBeginRedelegate,
  AminoMsgDelegate,
  AminoMsgUndelegate,
  AminoMsgBeginRedelegate,
  AminoMsgWithdrawDelegatorReward,
  */
} from "@cosmjs/stargate";
import { EncodeObject as ProtoMsg } from "@cosmjs/proto-signing";
import { MsgSend as ProtoMsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
//import { MsgDelegate, MsgUndelegate, MsgBeginRedelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import {
  ChainId,
  EncodedTransactionFormat,
  PlainTransaction,
  Transaction,
  TransactionMode,
} from "~/app/model/types_WIP";
import { fetchNetworkId, simulateTransaction } from "./backend/node";
import { CosmosChainParams, CosmosTransactionParams } from "./types";
import { COSMOS_GAS_AMPLIFIER, COSMOS_MOCK_PUBKEY, COSMOS_MOCK_SIGNATURE } from "./constants";
import { CHAINS } from "~/app/config/chains";
import { CosmosAccount } from "./backend/types";

// TODO Keep this file as a fourre-tout or split it?

function isBase64(str: string): boolean {
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(str);
}

function isValidAddress(address: string, chainId: ChainId): boolean {
  try {
    bech32.decode(address);
  } catch (e) {
    return false;
  }

  const chainParams = chainId && (CHAINS[chainId].params as CosmosChainParams);

  const prefix = chainParams?.prefix;
  const validatorPrefix = chainParams?.validatorPrefix;
  if (
    (!prefix || !address.startsWith(prefix)) &&
    (!validatorPrefix || !address.startsWith(validatorPrefix))
  ) {
    return false;
  }

  return true;
}

// Returns the provided CosmosAccount with updated pubKeyType and pubKey,
// depending on account and transaction data
function resolvePubKey(account: CosmosAccount, transaction: Transaction): CosmosAccount {
  const chainParams = CHAINS[transaction.plain.chainId].params as CosmosChainParams;
  const transactionParams = transaction.plain.params as CosmosTransactionParams;

  // pubKeyType and pubKey are provided by the blockchain only when the address has already done some transaction(s)
  const pubKeyType = account.pubKeyType || chainParams.defaultPubKeyType;
  const pubKey = account.pubKey || transactionParams?.pubKey;
  if (!pubKey) {
    transaction.status.errors.push({
      message: "Public key of the sender address not found on the blockchain, it must be provided manually",
    });
    return account;
  }

  return {
    ...account,
    pubKey: isBase64(pubKey) ? pubKey : Buffer.from(pubKey, "hex").toString("base64"),
    pubKeyType,
  };
}

async function getEstimatedFees(
  chainId: ChainId,
  account: CosmosAccount,
  transaction: PlainTransaction
): Promise<{
  gasWanted: bigint;
  gasWantedFees: bigint;
}> {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;

  const { protoMsgs } = getMessages(transaction);

  const txBytes = buildBroadcastPayload({
    protoMsgs,
    pubKeyType: chainParams.defaultPubKeyType,
    pubKey: COSMOS_MOCK_PUBKEY,
    sequence: account.sequence,
    gasLimit: undefined,
    feeAmount: [
      {
        denom: chainParams.denom,
        amount: "1", // Amount should just not be 0 as it would impact the simulation by requiring less gas
      },
    ],
    memo: transaction.memo || "",
    signature: COSMOS_MOCK_SIGNATURE,
  });

  const gasUsed = await (async (): Promise<bigint> => {
    try {
      const payload = JSON.stringify({
        tx_bytes: Array.from(txBytes),
      });
      return await simulateTransaction(chainId, payload);
    } catch (e) {
      console.warn("/!\\ Failed to estimate gas usage during tx simulation, using default value. Error:", e);
    }

    return BigInt(chainParams?.defaultGas);
  })();

  // Need to use the BigNumber lib to multiply bigints and floats...
  const gasWanted = new BigNumber(gasUsed.toString())
    .times(COSMOS_GAS_AMPLIFIER)
    .integerValue(BigNumber.ROUND_CEIL);
  const gasWantedFees = gasWanted.times(chainParams?.minGasPrice).integerValue(BigNumber.ROUND_CEIL);

  return { gasWanted: BigInt(gasWanted.toFixed()), gasWantedFees: BigInt(gasWantedFees.toFixed()) };
}

function getMessages(transaction: PlainTransaction): { aminoMsgs: AminoMsg[]; protoMsgs: ProtoMsg[] } {
  const chainParams = CHAINS[transaction.chainId].params as CosmosChainParams;

  const aminoMsgs: Array<AminoMsg> = [];
  const protoMsgs: Array<ProtoMsg> = [];
  switch (transaction.mode) {
    case TransactionMode.TRANSFER:
      const aminoMsg: AminoMsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: transaction.senders[0],
          to_address: transaction.recipients[0],
          amount: [
            {
              denom: chainParams?.denom,
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
              denom: chainParams?.denom,
              amount: transaction.amount.toString(),
            },
          ],
        }).finish(),
      };
      protoMsgs.push(protoMsg);
      break;
    case TransactionMode.DELEGATE:
      const aminoDelegateMsg: AminoMsgDelegate = {
        type: "cosmos-sdk/MsgDelegate",
        value: {
          delegator_address: transaction.senders[0],
          validator_address: transaction.validatorAddress,
          amount: {
            denom: chainParams?.denom,
            amount: transaction.amount.toString(),
          },
        },
      };
      aminoMsgs.push(aminoDelegateMsg);

      // PROTO MESSAGE
      protoMsgs.push({
        typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
        value: MsgDelegate.encode({
          delegatorAddress: transaction.senders[0],
          validatorAddress: transaction.validatorAddress,
          amount: {
            denom: chainParams?.denom,
            amount: transaction.amount.toString(),
          },
        }).finish(),
      });
      break;

    // case "redelegate":
    //   aminoMsgs.push({
    //     type: "cosmos-sdk/MsgBeginRedelegate",
    //     value: {
    //       delegator_address: transaction.senders[0],
    //       validator_src_address: transaction.sourceValidator,
    //       validator_dst_address: transaction.targetValidator,
    //       amount: {
    //         denom: chainParams?.denom,
    //         amount: transaction.amount.toString(),
    //       },
    //     },
    //   });

    //   // PROTO MESSAGE
    //   protoMsgs.push({
    //     typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
    //     value: MsgBeginRedelegate.encode({
    //       delegatorAddress: transaction.senders[0],
    //       validatorSrcAddress: transaction.sourceValidator,
    //       validatorDstAddress: transaction.targetValidator,
    //       amount: {
    //         denom: chainParams?.denom,
    //         amount: transaction.amount.toString(),
    //       },
    //     }).finish(),
    //   });
    //   break;
    /*

    case "undelegate":
      //if (transaction.validators && transaction.validators.length > 0) {
        const validator = transaction.validators[0];
        //if (validator && validator.address && validator.amount.gt(0)) {
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
        //}
      //}
      break;
    case "claimReward":
      //if (transaction.validators && transaction.validators.length > 0 && transaction.validators[0].address) {
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
      //}
      break;
    case "claimRewardCompound":
      //if (transaction.validators && transaction.validators.length > 0 && transaction.validators[0].address && transaction.validators[0].amount.gt(0)) {
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
      //}
      break;
      */
  }
  return { aminoMsgs, protoMsgs };
}

async function buildSignPayload(
  chainId: ChainId,
  account: CosmosAccount,
  transaction: PlainTransaction
): Promise<StdSignDoc> {
  if (!transaction.fees) {
    throw new Error("Missing fees data in transaction");
  } else if (!transaction.gas) {
    throw new Error("Missing gas data in transaction");
  }

  const chainParams = CHAINS[chainId].params as CosmosChainParams;

  const feeToEncode = {
    amount: [
      {
        denom: chainParams?.denom,
        amount: transaction.fees.toString(),
      },
    ],
    gas: transaction.gas.toString(),
  };

  const { aminoMsgs } = getMessages(transaction);
  const networkId = await fetchNetworkId(chainId);

  return makeSignDoc(
    aminoMsgs,
    feeToEncode,
    networkId,
    transaction.memo || "",
    account.accountNumber.toString(),
    account.sequence.toString()
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
  feeAmount: Coin[];
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
              key: Buffer.from(pubKey, isBase64(pubKey) ? "base64" : "hex"),
            }).finish(),
          },
          modeInfo: {
            single: {
              mode: SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
            },
            multi: undefined,
          },
          sequence,
        },
      ],
      fee: Fee.fromPartial({
        amount: feeAmount,
        gasLimit,
      }),
    }).finish(),
    signatures: [signature],
  }).finish();

  return signedTx;
}

async function encodeToSign(
  chainId: ChainId,
  account: CosmosAccount,
  transaction: PlainTransaction,
  format?: EncodedTransactionFormat
): Promise<string> {
  // NOTE Providing payload for an Amino signer (like Ledger)
  // Need to provide payload for Protobuf signer as well?...
  const signDoc = await buildSignPayload(chainId, account, transaction);

  if (format === EncodedTransactionFormat.JSON) {
    // FIXME we will need to redefine type here.
    return signDoc as unknown as string;
  }
  return Buffer.from(serializeSignDoc(signDoc)).toString("hex");
}

async function encodeToBroadcast(
  chainId: ChainId,
  account: CosmosAccount,
  signedTransaction: Transaction
): Promise<string> {
  if (!signedTransaction.signature) {
    throw new Error("Missing signature in transaction");
  }

  const signature = isBase64(signedTransaction.signature)
    ? fromBase64(signedTransaction.signature)
    : Buffer.from(
        Secp256k1Signature.fromDer(Buffer.from(signedTransaction.signature, "hex")).toFixedLength()
      );

  const plainTransation = signedTransaction.plain;

  const { protoMsgs } = getMessages(plainTransation);

  // NOTE Already built by encodeToSign()
  // Could be retrieved from transaction instead of building again?
  const signDoc = await buildSignPayload(chainId, account, plainTransation);

  const txBytes = buildBroadcastPayload({
    protoMsgs,
    memo: plainTransation.memo || "",
    pubKeyType: account.pubKeyType,
    pubKey: account.pubKey,
    feeAmount: signDoc.fee.amount as Coin[],
    gasLimit: BigInt(signDoc.fee.gas),
    sequence: BigInt(signDoc.sequence),
    signature,
  });

  return Buffer.from(txBytes).toString("hex");
}

export { isValidAddress, resolvePubKey, getEstimatedFees, encodeToSign, encodeToBroadcast };
