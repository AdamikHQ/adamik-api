import { CHAINS } from "~/app/config/chains";
import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { CosmosService } from ".";
import { fetchTransaction } from "../backend/node";
import { CosmosChainParams } from "../types";

async function getTransaction(
  this: CosmosService,
  transactionId: string
): Promise<FinalizedTransaction | null> {
  const cosmosTransaction = await fetchTransaction(this.chainId, transactionId);
  if (!cosmosTransaction) {
    return null;
  }

  const chainParams = CHAINS[this.chainId].params as CosmosChainParams;
  const feesAmount = cosmosTransaction.tx.auth_info.fee.amount.find(
    (a) => a.denom === chainParams.denom
  )?.amount;

  let parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId: this.chainId,
    id: cosmosTransaction.txhash,
    fees: BigInt(feesAmount || 0n),
    // Placeholder values, actual values filled below
    mode: TransactionMode.TRANSFER,
    state: TransactionState.UNCONFIRMED,
    senders: [],
    recipients: [],
  };

  if (cosmosTransaction.height !== "") {
    (parsedTransaction.state = TransactionState.CONFIRMED),
      (parsedTransaction.timestamp = new Date(cosmosTransaction.timestamp).getTime()),
      (parsedTransaction.blockHeight = BigInt(cosmosTransaction.height));
  }

  // TODO We handle only the 1st message at the moment, which covers most (all?) cases,
  // but maybe need to figure out what to do if there are more than 1
  const message = cosmosTransaction.tx.body.messages[0];

  const amount = BigInt(message.amount?.find((a: any) => a.denom === chainParams.denom)?.amount || 0n);

  switch (message["@type"]) {
    case "/cosmos.bank.v1beta1.MsgSend":
      parsedTransaction.mode = TransactionMode.TRANSFER;

      parsedTransaction.senders = [
        {
          address: message.from_address,
        },
      ];

      parsedTransaction.recipients = [
        {
          address: message.to_address,
          amount,
        },
      ];

      break;

    case "/cosmos.staking.v1beta1.MsgDelegate":
      parsedTransaction.mode = TransactionMode.DELEGATE;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount,
        },
      };

      break;

    case "/cosmos.staking.v1beta1.MsgBeginRedelegate":
      parsedTransaction.mode = TransactionMode.REDELEGATE;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
        },
      ];

      parsedTransaction.validators = {
        source: {
          address: message.validator_src_address,
        },
        target: {
          address: message.validator_dst_address,
          amount,
        },
      };

      break;

    case "/cosmos.staking.v1beta1.MsgUndelegate":
      parsedTransaction.mode = TransactionMode.UNDELEGATE;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount,
        },
      };

      break;

    case "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward":
      parsedTransaction.mode = TransactionMode.CLAIM_REWARDS;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount,
        },
      };

      break;

    // Not supported (yet?)
    default:
      console.warn(`/!\\ Unsupported parsing of transaction ${transactionId} for chainId ${this.chainId}`);
      return {
        raw: cosmosTransaction,
      };
  }

  return {
    parsed: parsedTransaction,
    raw: cosmosTransaction,
  };
}

export { getTransaction };
