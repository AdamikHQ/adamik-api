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
import { TransactionData, TransactionMode } from "~/app/model/types_WIP";
import { CosmosAccount } from "../backend/types";

function buildStdSignDocForInjective(
  account: CosmosAccount,
  transaction: TransactionData,
  networkId: string
): StdSignDoc {
  const msgs = buildMessagesForInjective(transaction);

  return getAminoStdSignDoc({
    chainId: networkId as CosmosChainId,
    msgs,
    sequence: Number(account.sequence),
    accountNumber: Number(account.accountNumber),
    memo: transaction.memo || "",
  });
}

function buildMessagesForInjective(
  transaction: TransactionData
): (MsgSend | MsgDelegate | MsgBeginRedelegate | MsgUndelegate | MsgWithdrawDelegatorReward)[] {
  const amount = transaction.amount as bigint;
  const msgs = [];
  switch (transaction.mode) {
    case TransactionMode.TRANSFER:
      msgs.push(
        MsgSend.fromJSON({
          srcInjectiveAddress: transaction.sender,
          dstInjectiveAddress: transaction.recipient,
          amount: [
            {
              denom: "inj",
              amount: amount.toString(),
            },
          ],
        })
      );
      break;
    case TransactionMode.DELEGATE:
      msgs.push(
        MsgDelegate.fromJSON({
          injectiveAddress: transaction.sender,
          validatorAddress: transaction.validatorAddress,
          amount: {
            denom: "inj",
            amount: amount.toString(),
          },
        })
      );
      break;

    case TransactionMode.REDELEGATE:
      msgs.push(
        MsgBeginRedelegate.fromJSON({
          injectiveAddress: transaction.sender,
          srcValidatorAddress: transaction.sourceValidatorAddress,
          dstValidatorAddress: transaction.targetValidatorAddress,
          amount: {
            denom: "inj",
            amount: amount.toString(),
          },
        })
      );
      break;

    case TransactionMode.UNDELEGATE:
      msgs.push(
        MsgUndelegate.fromJSON({
          injectiveAddress: transaction.sender,
          validatorAddress: transaction.validatorAddress,
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
          delegatorAddress: transaction.sender,
          validatorAddress: transaction.validatorAddress,
        })
      );
      break;
  }

  return msgs;
}

export { buildStdSignDocForInjective };
