import { StdSignDoc } from "@cosmjs/amino";
import {
  MsgBeginRedelegate,
  MsgDelegate,
  MsgSend,
  MsgUndelegate,
  MsgWithdrawDelegatorReward,
  getAminoStdSignDoc,
} from "@injectivelabs/sdk-ts";
import { ChainId as CosmosChainId } from "@injectivelabs/ts-types";
import { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { TransactionData, TransactionMode } from "~/app/model/types_WIP";
import { CosmosAccount } from "../backend/types";

function buildSignDocProtobufForInjective(
  account: CosmosAccount,
  transactionData: TransactionData,
  networkId: string
): SignDoc {
  // TODO
  throw new Error("Protobuf signing is not supported for Injective");
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
