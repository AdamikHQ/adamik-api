import { StdFee, StdSignDoc } from "@cosmjs/amino";
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
import { ChainId, EncodedTransactionFormat, TransactionData, TransactionMode } from "~/app/model/types_WIP";
import { CosmosAccount } from "../backend/types";
import { resolvePubKey } from "../logic";

function buildSignDocProtobufForInjective(
  account: CosmosAccount,
  transactionData: TransactionData,
  networkId: string,
  feeData: StdFee,
  format?: EncodedTransactionFormat
): string {
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
    chainId: networkId as CosmosChainId,
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

  const signDoc = createSignDoc({
    accountNumber: Number(account.accountNumber),
    authInfoBytes: CosmosTxV1Beta1Tx.AuthInfo.encode(authInfo).finish(),
    bodyBytes: CosmosTxV1Beta1Tx.TxBody.encode(bodyBytes).finish(),
    chainId: networkId as CosmosChainId,
  });

  return format === EncodedTransactionFormat.JSON
    ? JSON.stringify(CosmosTxV1Beta1Tx.SignDoc.toJSON(signDoc))
    : Buffer.from(CosmosTxV1Beta1Tx.SignDoc.encode(signDoc).finish()).toString("hex");
}

function buildSignDocAminoForInjective(
  account: CosmosAccount,
  transactionData: TransactionData,
  networkId: string
): StdSignDoc {
  const msgs = buildMessagesForInjective(transactionData);

  return getAminoStdSignDoc({
    chainId: networkId as CosmosChainId,
    msgs,
    sequence: Number(account.sequence),
    accountNumber: Number(account.accountNumber),
    memo: transactionData.memo || "",
  });
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

export { buildSignDocAminoForInjective, buildSignDocProtobufForInjective };
