import { AminoMsg, makeSignDoc, serializeSignDoc, StdFee } from "@cosmjs/amino";
import { Secp256k1Signature } from "@cosmjs/crypto";
import { fromBase64, fromHex } from "@cosmjs/encoding";
import { EncodeObject as ProtoMsg } from "@cosmjs/proto-signing";
import {
  AminoMsgBeginRedelegate,
  AminoMsgDelegate,
  AminoMsgSend,
  AminoMsgUndelegate,
  AminoMsgWithdrawDelegatorReward,
} from "@cosmjs/stargate";
import { bech32 } from "bech32";
import { BigNumber } from "bignumber.js";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import { PubKey } from "cosmjs-types/cosmos/crypto/secp256k1/keys";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import { MsgBeginRedelegate, MsgDelegate, MsgUndelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { AuthInfo, Fee, TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  EncodedTransactionFormat,
  StakingPosition,
  Transaction,
  TransactionData,
  TransactionMode,
} from "~/app/model/types_WIP";
import { statusFromMessage } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { fetchBalances, fetchDelegations, simulateTransaction } from "./backend/node";
import { CosmosAccount } from "./backend/types";
import { buildStdSignDocForInjective } from "./chains/injective";
import { COSMOS_GAS_AMPLIFIER, COSMOS_MOCK_PUBKEY, COSMOS_MOCK_SIGNATURE } from "./constants";
import { CosmosChainParams } from "./types";

// TODO Keep this file as a fourre-tout or split it?

function isHex(str: string): boolean {
  // Regex to match hexadecimal characters
  const hexRegex = /^[0-9A-Fa-f]+$/;
  return hexRegex.test(str);
}

function getDelegation(
  delegations: StakingPosition[],
  validatorAddress: string
): StakingPosition | undefined {
  return delegations.find(
    (delegation) =>
      delegation.validatorAddresses?.length && delegation.validatorAddresses[0] === validatorAddress
  );
}

async function getAvailableBalance(chainId: ChainId, address: string) {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;

  const balances = await fetchBalances(chainId, address);
  const balance = balances.find((balance) => balance.denom === chainParams?.denom);

  return balance ? BigInt(balance.amount) : 0n;
}

async function getStakedBalance(chainId: ChainId, senderAddress: string, validatorAddress: string) {
  const delegations = await fetchDelegations(chainId, senderAddress);
  const stakedBalance = getDelegation(delegations, validatorAddress);

  return stakedBalance ? stakedBalance.amount : 0n;
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
  return (
    (!!prefix && address.startsWith(prefix)) || (!!validatorPrefix && address.startsWith(validatorPrefix))
  );
}

// Returns the provided CosmosAccount with updated pubKeyType and pubKey,
// depending on account and transaction data
function resolvePubKey(chainId: ChainId, account: CosmosAccount, transaction: Transaction): CosmosAccount {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;

  // pubKeyType and pubKey are provided by the blockchain only when the address has already done some transaction(s)
  const pubKeyType = account.pubKeyType || chainParams.defaultPubKeyType;
  const pubKey = account.pubKey || transaction.data.senderPubKey;
  if (!pubKey) {
    throw new InvalidTransactionError(
      statusFromMessage(
        "Public key of the sender address not found on the blockchain, it must be provided manually"
      )
    );
    // FIXME: should we return the account instead of breaking the flow?
  }

  return {
    ...account,
    pubKey: isHex(pubKey) ? Buffer.from(pubKey, "hex").toString("base64") : pubKey,
    pubKeyType,
  };
}

async function getEstimatedFees(
  chainId: ChainId,
  account: CosmosAccount,
  transactionData: TransactionData
): Promise<{
  gasWanted: bigint;
  gasWantedFees: bigint;
}> {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;

  const { protoMsgs } = buildMessages(chainId, transactionData);

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
    memo: transactionData.memo || "",
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

function buildMessages(
  chainId: ChainId,
  transactionData: TransactionData
): {
  aminoMsgs: AminoMsg[];
  protoMsgs: ProtoMsg[];
} {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;
  // amount is safe to cast as it's guaranteed to be filed in by completeTransaction
  const amount = transactionData.amount as bigint;

  const aminoMsgs: Array<AminoMsg> = [];
  const protoMsgs: Array<ProtoMsg> = [];
  switch (transactionData.mode) {
    case TransactionMode.TRANSFER:
      const aminoTransferMsg: AminoMsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: transactionData.senderAddress,
          to_address: transactionData.recipientAddress,
          amount: [
            {
              denom: chainParams?.denom,
              amount: amount.toString(),
            },
          ],
        },
      };
      aminoMsgs.push(aminoTransferMsg);

      const protoTransferMsg: ProtoMsg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.encode({
          fromAddress: transactionData.senderAddress,
          toAddress: transactionData.recipientAddress,
          amount: [
            {
              denom: chainParams?.denom,
              amount: amount.toString(),
            },
          ],
        }).finish(),
      };
      protoMsgs.push(protoTransferMsg);
      break;

    case TransactionMode.STAKE:
      if (transactionData.sourceValidatorAddress?.length) {
        // Redelegate
        const aminoRedelegateMsg: AminoMsgBeginRedelegate = {
          type: "cosmos-sdk/MsgBeginRedelegate",
          value: {
            delegator_address: transactionData.senderAddress,
            validator_src_address: transactionData.sourceValidatorAddress,
            validator_dst_address: transactionData.targetValidatorAddress,
            amount: {
              denom: chainParams?.denom,
              amount: amount.toString(),
            },
          },
        };
        aminoMsgs.push(aminoRedelegateMsg);

        const protoRedelegateMsg: ProtoMsg = {
          typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
          value: MsgBeginRedelegate.encode({
            delegatorAddress: transactionData.senderAddress,
            validatorSrcAddress: transactionData.sourceValidatorAddress,
            validatorDstAddress: transactionData.targetValidatorAddress,
            amount: {
              denom: chainParams?.denom,
              amount: amount.toString(),
            },
          }).finish(),
        };
        protoMsgs.push(protoRedelegateMsg);
      } else {
        // Delegate
        const aminoDelegateMsg: AminoMsgDelegate = {
          type: "cosmos-sdk/MsgDelegate",
          value: {
            delegator_address: transactionData.senderAddress,
            validator_address: transactionData.targetValidatorAddress,
            amount: {
              denom: chainParams?.denom,
              amount: amount.toString(),
            },
          },
        };
        aminoMsgs.push(aminoDelegateMsg);

        const protoDelegateMsg: ProtoMsg = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: MsgDelegate.encode({
            delegatorAddress: transactionData.senderAddress,
            validatorAddress: transactionData.targetValidatorAddress,
            amount: {
              denom: chainParams?.denom,
              amount: amount.toString(),
            },
          }).finish(),
        };
        protoMsgs.push(protoDelegateMsg);
      }
      break;

    case TransactionMode.UNSTAKE:
      {
        const aminoUndelegateMsg: AminoMsgUndelegate = {
          type: "cosmos-sdk/MsgUndelegate",
          value: {
            delegator_address: transactionData.senderAddress,
            validator_address: transactionData.validatorAddress,
            amount: {
              denom: chainParams?.denom,
              amount: amount.toString(),
            },
          },
        };
        aminoMsgs.push(aminoUndelegateMsg);

        const protoUndelegateMsg: ProtoMsg = {
          typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
          value: MsgUndelegate.encode({
            delegatorAddress: transactionData.senderAddress,
            validatorAddress: transactionData.validatorAddress,
            amount: {
              denom: chainParams?.denom,
              amount: amount.toString(),
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
            delegator_address: transactionData.senderAddress,
            validator_address: transactionData.validatorAddress,
          },
        };
        aminoMsgs.push(aminoClaimRewardsMsg);

        const protoClaimRewardsMsg: ProtoMsg = {
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: MsgWithdrawDelegatorReward.encode({
            delegatorAddress: transactionData.senderAddress,
            validatorAddress: transactionData.validatorAddress,
          }).finish(),
        };
        protoMsgs.push(protoClaimRewardsMsg);

        if (transactionData.compound) {
          const aminoDelegateMsg: AminoMsgDelegate = {
            type: "cosmos-sdk/MsgDelegate",
            value: {
              delegator_address: transactionData.senderAddress,
              validator_address: transactionData.validatorAddress,
              amount: {
                denom: chainParams?.denom,
                amount: amount.toString(),
              },
            },
          };
          aminoMsgs.push(aminoDelegateMsg);

          const protoDelegateMsg: ProtoMsg = {
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: MsgDelegate.encode({
              delegatorAddress: transactionData.senderAddress,
              validatorAddress: transactionData.validatorAddress,
              amount: {
                denom: chainParams?.denom,
                amount: amount.toString(),
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

function buildStdSignDoc(
  chainId: ChainId,
  account: CosmosAccount,
  transactionData: TransactionData,
  networkId: string,
  feeToEncode: StdFee
) {
  const { aminoMsgs } = buildMessages(chainId, transactionData);

  return makeSignDoc(
    aminoMsgs,
    feeToEncode,
    networkId,
    transactionData.memo || "",
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
              key: Buffer.from(pubKey, isHex(pubKey) ? "hex" : "base64"),
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

// TODO Currently providing payload for an Amino signer (like Ledger)
// Need to support providing payload for Protobuf signer as well?...
function encodeToSign(
  chainId: ChainId,
  account: CosmosAccount,
  transactionData: TransactionData,
  format?: EncodedTransactionFormat
): string {
  if (!transactionData.fees) {
    throw new Error("Missing fees data in transaction");
  } else if (!transactionData.gas) {
    throw new Error("Missing gas data in transaction");
  }

  const chain = CHAINS[chainId];
  const chainParams = chain.params as CosmosChainParams;

  const feeToEncode = {
    amount: [
      {
        denom: chainParams?.denom,
        amount: transactionData.fees.toString(),
      },
    ],
    gas: transactionData.gas.toString(),
  };

  const signDoc =
    chainId === ChainId.INJECTIVE
      ? buildStdSignDocForInjective(account, transactionData, chain.nativeId)
      : buildStdSignDoc(chainId, account, transactionData, chain.nativeId, feeToEncode);

  const serializedSignDoc = Buffer.from(serializeSignDoc(signDoc));

  return format === EncodedTransactionFormat.JSON
    ? serializedSignDoc.toString("utf8")
    : serializedSignDoc.toString("hex");
}

function encodeToBroadcast(chainId: ChainId, account: CosmosAccount, signedTransaction: Transaction): string {
  const transactionData = signedTransaction.data;
  // useless checks to make the compiler happy, completeTransaction already validated the fields
  // We don't want transactionData.nonce === 0 to be falsy
  if (transactionData.nonce === undefined) {
    throw new Error("Missing transaction nonce");
  }
  if (!signedTransaction.signature) {
    throw new Error("Missing signature in transaction");
  }

  const signature = isHex(signedTransaction.signature)
    ? Buffer.from(Secp256k1Signature.fromDer(fromHex(signedTransaction.signature)).toFixedLength())
    : Buffer.from(fromBase64(signedTransaction.signature));

  const { protoMsgs } = buildMessages(chainId, transactionData);

  const chainParams = chainId && (CHAINS[chainId].params as CosmosChainParams);

  // fees is safe to cast as it's guaranteed to be filled in by completeTransaction
  const fees = transactionData.fees as bigint;
  const txBytes = buildBroadcastPayload({
    pubKeyType: account.pubKeyType,
    pubKey: account.pubKey,
    feeAmount: [{ amount: fees.toString(), denom: chainParams.denom }] as Coin[],
    gasLimit: transactionData.gas,
    sequence: transactionData.nonce,
    memo: transactionData.memo || "",
    protoMsgs,
    signature,
  });

  return Buffer.from(txBytes).toString("hex");
}

export {
  encodeToBroadcast,
  encodeToSign,
  getAvailableBalance,
  getDelegation,
  getEstimatedFees,
  getStakedBalance,
  isHex,
  isValidAddress,
  resolvePubKey,
};
