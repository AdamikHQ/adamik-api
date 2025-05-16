import { serializeSignDoc, StdFee } from "@cosmjs/amino";
import {
  CosmosTxV1Beta1Tx,
  createAnyMessage,
  createAuthInfo,
  createFee,
  createSignDoc,
  createSigners,
  getAminoStdSignDoc,
  MsgBeginRedelegate,
  MsgDelegate,
  MsgSend,
  MsgUndelegate,
  MsgWithdrawDelegatorReward,
} from "@injectivelabs/sdk-ts";
import { ChainId as CosmosChainId } from "@injectivelabs/ts-types";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { Chain, ChainId, TransactionData, TransactionMode } from "~/app/model/types_WIP";
import { CosmosAccount } from "../backend/types";
import { resolvePubKey } from "../logic";

function buildEncodedProtobufForInjective(
  chain: Chain,
  account: CosmosAccount,
  transactionData: TransactionData,
  feeData: StdFee
): { hexSignDocProtobuf: string; jsonSignDocProtobuf: string } {
  const { pubKey } = resolvePubKey(ChainId.INJECTIVE, account, transactionData);

  const protoMsgs = buildMessagesForInjective(transactionData);

  const bodyBytes = CosmosTxV1Beta1Tx.TxBody.create();
  bodyBytes.messages = protoMsgs.map((message) =>
    createAnyMessage({
      value: message.toBinary(),
      type: message.toDirectSign().type,
    })
  );
  bodyBytes.memo = transactionData.memo || "";

  const signInfo = createSigners({
    chainId: chain.nativeId as CosmosChainId,
    mode: SignMode.SIGN_MODE_DIRECT,
    signers: [
      {
        pubKey: pubKey,
        sequence: Number(account.sequence),
      },
    ],
  });

  const fees = createFee({
    fee: feeData.amount[0],
    payer: feeData.payer,
    granter: feeData.granter,
    gasLimit: parseInt(feeData.gas, 10),
  });

  const authInfo = createAuthInfo({
    signerInfo: signInfo,
    fee: fees,
  });

  const signDocProtobuf = createSignDoc({
    accountNumber: Number(account.accountNumber),
    authInfoBytes: CosmosTxV1Beta1Tx.AuthInfo.encode(authInfo).finish(),
    bodyBytes: CosmosTxV1Beta1Tx.TxBody.encode(bodyBytes).finish(),
    chainId: chain.nativeId as CosmosChainId,
  });

  return {
    hexSignDocProtobuf: Buffer.from(CosmosTxV1Beta1Tx.SignDoc.encode(signDocProtobuf).finish()).toString(
      "hex"
    ),
    jsonSignDocProtobuf: JSON.stringify(CosmosTxV1Beta1Tx.SignDoc.toJSON(signDocProtobuf)),
  };
}

function buildEncodedAminoForInjective(
  chain: Chain,
  account: CosmosAccount,
  transactionData: TransactionData
): { hexSignDocAmino: string; jsonSignDocAmino: string } {
  const msgs = buildMessagesForInjective(transactionData);

  const signDocAmino = getAminoStdSignDoc({
    chainId: chain.nativeId as CosmosChainId,
    msgs,
    sequence: Number(account.sequence),
    accountNumber: Number(account.accountNumber),
    memo: transactionData.memo || "",
  });

  const serializedSignDocAmino = Buffer.from(serializeSignDoc(signDocAmino));

  return {
    hexSignDocAmino: serializedSignDocAmino.toString("hex"),
    jsonSignDocAmino: serializedSignDocAmino.toString("utf8"),
  };
}

function buildMessagesForInjective(
  transactionData: TransactionData
): (MsgSend | MsgDelegate | MsgBeginRedelegate | MsgUndelegate | MsgWithdrawDelegatorReward)[] {
  const amount = transactionData.amount as bigint;
  const msgs = [];
  switch (transactionData.mode) {
    case TransactionMode.TRANSFER:
      msgs.push(
        MsgSend.fromJSON({
          srcInjectiveAddress: transactionData.senderAddress,
          dstInjectiveAddress: transactionData.recipientAddress,
          amount: [
            {
              denom: "inj",
              amount: amount.toString(),
            },
          ],
        })
      );
      break;
    case TransactionMode.STAKE:
      if (transactionData.sourceValidatorAddress?.length) {
        // Redelegate
        msgs.push(
          MsgBeginRedelegate.fromJSON({
            injectiveAddress: transactionData.senderAddress,
            srcValidatorAddress: transactionData.sourceValidatorAddress,
            dstValidatorAddress: transactionData.targetValidatorAddress,
            amount: {
              denom: "inj",
              amount: amount.toString(),
            },
          })
        );
      } else {
        // Delegate
        msgs.push(
          MsgDelegate.fromJSON({
            injectiveAddress: transactionData.senderAddress,
            validatorAddress: transactionData.targetValidatorAddress,
            amount: {
              denom: "inj",
              amount: amount.toString(),
            },
          })
        );
      }
      break;

    case TransactionMode.UNSTAKE:
      msgs.push(
        MsgUndelegate.fromJSON({
          injectiveAddress: transactionData.senderAddress,
          validatorAddress: transactionData.validatorAddress,
          amount: {
            denom: "inj",
            amount: amount.toString(),
          },
        })
      );
      break;

    case TransactionMode.CLAIM_REWARDS:
      msgs.push(
        MsgWithdrawDelegatorReward.fromJSON({
          delegatorAddress: transactionData.senderAddress,
          validatorAddress: transactionData.validatorAddress,
        })
      );
      break;
  }

  return msgs;
}

export { buildEncodedAminoForInjective, buildEncodedProtobufForInjective };
