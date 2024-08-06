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
  AminoMsgSend,
  AminoMsgDelegate,
  AminoMsgBeginRedelegate,
  AminoMsgUndelegate,
  AminoMsgWithdrawDelegatorReward,
} from "@cosmjs/stargate";
import { EncodeObject as ProtoMsg } from "@cosmjs/proto-signing";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { MsgDelegate, MsgUndelegate, MsgBeginRedelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import {
  ChainId,
  EncodedTransactionFormat,
  PlainTransaction,
  StakingPosition,
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

function getDelegation(
  delegations: StakingPosition[],
  plainTransaction: PlainTransaction
): StakingPosition | undefined {
  if (
    plainTransaction.mode === TransactionMode.REDELEGATE ||
    plainTransaction.mode === TransactionMode.UNDELEGATE ||
    plainTransaction.mode === TransactionMode.CLAIM_REWARDS
  ) {
    return delegations.find(
      (delegation) =>
        delegation.validatorAddresses?.length &&
        delegation.validatorAddresses[0] ===
          (plainTransaction.mode === TransactionMode.REDELEGATE
            ? plainTransaction.sourceValidatorAddress
            : plainTransaction.validatorAddress)
    );
  }
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

  const { protoMsgs } = buildMessages(transaction);

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

  const gasWanted = await (async (): Promise<BigNumber> => {
    try {
      const payload = JSON.stringify({
        tx_bytes: Buffer.from(txBytes).toString("base64"),
      });

      const gasUsed = await simulateTransaction(chainId, payload);

      // Need to use the BigNumber lib to multiply bigints and floats...
      return new BigNumber(gasUsed.toString()).times(COSMOS_GAS_AMPLIFIER).integerValue(BigNumber.ROUND_CEIL);
    } catch (e) {
      console.warn("/!\\ Failed to estimate gas usage during tx simulation, using default value. Error:", e);
      return new BigNumber(chainParams?.defaultGas);
    }
  })();

  const gasWantedFees = gasWanted.times(chainParams?.minGasPrice).integerValue(BigNumber.ROUND_CEIL);

  return { gasWanted: BigInt(gasWanted.toFixed()), gasWantedFees: BigInt(gasWantedFees.toFixed()) };
}

function buildMessages(transaction: PlainTransaction): { aminoMsgs: AminoMsg[]; protoMsgs: ProtoMsg[] } {
  const chainParams = CHAINS[transaction.chainId].params as CosmosChainParams;

  const aminoMsgs: Array<AminoMsg> = [];
  const protoMsgs: Array<ProtoMsg> = [];
  switch (transaction.mode) {
    case TransactionMode.TRANSFER:
      const aminoTransferMsg: AminoMsgSend = {
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
      aminoMsgs.push(aminoTransferMsg);

      const protoTransferMsg: ProtoMsg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.encode({
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
      protoMsgs.push(protoTransferMsg);
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

      const protoDelegateMsg: ProtoMsg = {
        typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
        value: MsgDelegate.encode({
          delegatorAddress: transaction.senders[0],
          validatorAddress: transaction.validatorAddress,
          amount: {
            denom: chainParams?.denom,
            amount: transaction.amount.toString(),
          },
        }).finish(),
      };
      protoMsgs.push(protoDelegateMsg);
      break;

    case TransactionMode.REDELEGATE:
      const aminoRedelegateMsg: AminoMsgBeginRedelegate = {
        type: "cosmos-sdk/MsgBeginRedelegate",
        value: {
          delegator_address: transaction.senders[0],
          validator_src_address: transaction.sourceValidatorAddress,
          validator_dst_address: transaction.targetValidatorAddress,
          amount: {
            denom: chainParams?.denom,
            amount: transaction.amount.toString(),
          },
        },
      };
      aminoMsgs.push(aminoRedelegateMsg);

      const protoRedelegateMsg: ProtoMsg = {
        typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
        value: MsgBeginRedelegate.encode({
          delegatorAddress: transaction.senders[0],
          validatorSrcAddress: transaction.sourceValidatorAddress,
          validatorDstAddress: transaction.targetValidatorAddress,
          amount: {
            denom: chainParams?.denom,
            amount: transaction.amount.toString(),
          },
        }).finish(),
      };
      protoMsgs.push(protoRedelegateMsg);
      break;

    case TransactionMode.UNDELEGATE:
      {
        const aminoUndelegateMsg: AminoMsgUndelegate = {
          type: "cosmos-sdk/MsgUndelegate",
          value: {
            delegator_address: transaction.senders[0],
            validator_address: transaction.validatorAddress,
            amount: {
              denom: chainParams?.denom,
              amount: transaction.amount.toString(),
            },
          },
        };
        aminoMsgs.push(aminoUndelegateMsg);

        const protoUndelegateMsg: ProtoMsg = {
          typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
          value: MsgUndelegate.encode({
            delegatorAddress: transaction.senders[0],
            validatorAddress: transaction.validatorAddress,
            amount: {
              denom: chainParams?.denom,
              amount: transaction.amount.toString(),
            },
          }).finish(),
        };
        protoMsgs.push(protoUndelegateMsg);
      }
      break;

    case TransactionMode.CLAIM_REWARDS:
      {
        const aminoClaimRewardsMsg: AminoMsgWithdrawDelegatorReward = {
          type: "cosmos-sdk/MsgWithdrawDelegationReward",
          value: {
            delegator_address: transaction.senders[0],
            validator_address: transaction.validatorAddress,
          },
        };
        aminoMsgs.push(aminoClaimRewardsMsg);

        const protoClaimRewardsMsg: ProtoMsg = {
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: MsgWithdrawDelegatorReward.encode({
            delegatorAddress: transaction.senders[0],
            validatorAddress: transaction.validatorAddress,
          }).finish(),
        };
        protoMsgs.push(protoClaimRewardsMsg);

        if (transaction.compound) {
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

          const protoDelegateMsg: ProtoMsg = {
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: MsgDelegate.encode({
              delegatorAddress: transaction.senders[0],
              validatorAddress: transaction.validatorAddress,
              amount: {
                denom: chainParams?.denom,
                amount: transaction.amount.toString(),
              },
            }).finish(),
          };
          protoMsgs.push(protoDelegateMsg);
        }
      }
      break;
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

  const { aminoMsgs } = buildMessages(transaction);
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
  const plainTransation = signedTransaction.plain;
  if (!plainTransation.nonce) {
    throw new Error("Missing transaction nonce");
  }
  if (!signedTransaction.signature) {
    throw new Error("Missing signature in transaction");
  }

  const signature = isBase64(signedTransaction.signature)
    ? fromBase64(signedTransaction.signature)
    : Buffer.from(
        Secp256k1Signature.fromDer(Buffer.from(signedTransaction.signature, "hex")).toFixedLength()
      );

  const { protoMsgs } = buildMessages(plainTransation);

  const chainParams = chainId && (CHAINS[chainId].params as CosmosChainParams);
  const txBytes = buildBroadcastPayload({
    pubKeyType: account.pubKeyType,
    pubKey: account.pubKey,
    feeAmount: [{ amount: plainTransation.fees.toString(), denom: chainParams.denom }] as Coin[],
    gasLimit: plainTransation.gas,
    sequence: plainTransation.nonce,
    memo: plainTransation.memo || "",
    protoMsgs,
    signature,
  });

  return Buffer.from(txBytes).toString("hex");
}

export { getDelegation, isValidAddress, resolvePubKey, getEstimatedFees, encodeToSign, encodeToBroadcast };
