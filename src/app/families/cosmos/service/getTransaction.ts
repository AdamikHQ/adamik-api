import { CHAINS } from "~/app/config/chains";
import { FinalizedTransaction, Status, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { CosmosService } from ".";
import { fetchTransaction } from "../backend/node";
import { CosmosChainParams } from "../types";

async function getTransaction(
  this: CosmosService,
  transactionId: string,
  status: Status
): Promise<FinalizedTransaction> {
  const cosmosTransaction = await fetchTransaction(this.chainId, transactionId);
  if (!cosmosTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  const chainParams = CHAINS[this.chainId].params as CosmosChainParams;
  const feesAmount = cosmosTransaction.tx.auth_info.fee.amount.find(
    (a) => a.denom === chainParams.denom
  )?.amount;

  let parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId: this.chainId,
    id: cosmosTransaction.txhash,
    fees: BigInt(feesAmount || 0n),
    gas: BigInt(cosmosTransaction.gas_used),
    // Placeholder values, actual values filled below
    mode: TransactionMode.TRANSFER,
    state: TransactionState.UNCONFIRMED,
    senders: [],
  };

  if (cosmosTransaction.height !== "") {
    parsedTransaction.timestamp = new Date(cosmosTransaction.timestamp).getTime();
    parsedTransaction.blockHeight = BigInt(cosmosTransaction.height);

    if (cosmosTransaction.code === 0) {
      parsedTransaction.state = TransactionState.CONFIRMED;
    } else {
      parsedTransaction.state = TransactionState.FAILED;
    }
  }

  const signerInfos = cosmosTransaction.tx.auth_info.signer_infos;
  if (signerInfos.length && signerInfos[0].sequence !== undefined) {
    parsedTransaction.nonce = BigInt(signerInfos[0].sequence);
  }

  // TODO We handle only the 1st message at the moment, which covers most (all?) cases,
  // but maybe need to figure out what to do if there are more than 1
  const message = cosmosTransaction.tx.body.messages[0];

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
          amount: BigInt(message.amount?.find((a: any) => a.denom === chainParams.denom)?.amount || 0n),
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
          amount: BigInt(message.amount.amount || 0n),
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
          amount: BigInt(message.amount.amount || 0n),
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
          amount: BigInt(message.amount.amount || 0n),
        },
      };

      break;

    case "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward":
      // Multiple reward amounts will be crammed in the 'value' string, e.g:
      // "value": "104ibc/D41ECC8FEF1B7E9C4BCC58B1362588420853A9D0B898EDD513D9B79AFFA195C8,5ibc/E92E07E68705FAD13305EE9C73684B30A7B66A52F54C9890327E0A4C0F1D22E3,...,84047uatom"
      const withdrawEvent = cosmosTransaction.events.find((event) => event.type === "withdraw_rewards");
      const amounts = withdrawEvent?.attributes.find((attr) => attr.key === "amount")?.value;

      // So we parse it to only get native rewards at the moment, IBC rewards are not supported for now
      const amount = amounts
        ?.split(",")
        .find((amount) => amount.includes(chainParams.denom)) // --> "84047uatom" (keep only the native amount)
        ?.slice(0, -chainParams.denom.length); // -->"84047" (keep only its value)

      parsedTransaction.mode = TransactionMode.CLAIM_REWARDS;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount: BigInt(amount || 0n),
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
