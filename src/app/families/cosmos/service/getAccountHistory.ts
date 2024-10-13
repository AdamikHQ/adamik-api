import { CHAINS } from "~/app/config/chains";
import {
  AccountHistory,
  AccountHistoryPagination,
  ApiRequestFilters,
  FinalizedTransaction,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { CosmosService } from ".";
import { fetchAccountTransactions } from "../backend/mintscan";
import { CosmosMessageType } from "../backend/types";
import { CosmosChainParams } from "../types";

// TODO Test this
// TODO Put logic in common with getTransaction (replace node implem with mintscan)

async function getAccountHistory(
  this: CosmosService,
  accountId: string,
  pagination: AccountHistoryPagination,
  filters: ApiRequestFilters
): Promise<AccountHistory> {
  const chainParams = CHAINS[this.chainId].params as CosmosChainParams;

  // TODO Apply filters

  const mintscanTransactions = await fetchAccountTransactions(this.chainId, accountId, pagination);

  const transactions: FinalizedTransaction[] = [];

  for (const mintscanTransaction of mintscanTransactions) {
    const tx = mintscanTransaction.tx["/cosmos-tx-v1beta1-Tx"];

    const parsedTransaction: FinalizedTransaction["parsed"] = {
      chainId: this.chainId,
      id: mintscanTransaction.txhash,
      fees: {
        // TODO Would deserve some sanitization...
        amount: BigInt(tx.auth_info.fee.amount[0].amount),
        ticker: tx.auth_info.fee.amount[0].denom,
      },
      gas: BigInt(mintscanTransaction.gas_used),
      nonce: BigInt(tx.auth_info.signer_infos[0].sequence),
      // Placeholder values, actual values filled below
      mode: TransactionMode.TRANSFER,
      state: TransactionState.PENDING,
      senders: [],
    };

    if (mintscanTransaction.height !== "") {
      parsedTransaction.blockHeight = BigInt(mintscanTransaction.height);
      parsedTransaction.timestamp = new Date(mintscanTransaction.timestamp).getTime();

      if (mintscanTransaction.code === 0) {
        parsedTransaction.state = TransactionState.CONFIRMED;
      } else {
        parsedTransaction.state = TransactionState.FAILED;
      }
    }

    // TODO Handling only the 1st message at the moment, but should handle them all into individual transactions
    switch (tx.body.messages[0]["@type"] as CosmosMessageType) {
      case "/cosmos-bank-v1beta1-MsgSend": {
        const message = tx.body.messages[0]["/cosmos-bank-v1beta1-MsgSend"]!;

        parsedTransaction.mode = TransactionMode.TRANSFER;

        parsedTransaction.senders = [
          {
            address: message.from_address,
          },
        ];

        parsedTransaction.recipients = [
          {
            address: message.to_address,
            amount: BigInt(message.amount[0].amount),
            ticker: message.amount[0].denom, // FIXME Could need a mapping with the tickers that we define in config/chains.ts
          },
        ];

        break;
      }
      case "/cosmos-staking-v1beta1-MsgDelegate": {
        const message = tx.body.messages[0]["/cosmos-staking-v1beta1-MsgDelegate"]!;

        parsedTransaction.mode = TransactionMode.DELEGATE;

        parsedTransaction.senders = [
          {
            address: message.delegator_address,
          },
        ];

        parsedTransaction.validators = {
          target: {
            address: message.validator_address,
            amount: BigInt(message.amount.amount),
          },
        };

        break;
      }
      case "/cosmos-staking-v1beta1-MsgBeginRedelegate": {
        const message = tx.body.messages[0]["/cosmos-staking-v1beta1-MsgBeginRedelegate"]!;

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
            amount: BigInt(message.amount.amount),
          },
        };

        break;
      }
      case "/cosmos-staking-v1beta1-MsgUndelegate": {
        const message = tx.body.messages[0]["/cosmos-staking-v1beta1-MsgUndelegate"]!;

        parsedTransaction.mode = TransactionMode.UNDELEGATE;

        parsedTransaction.senders = [
          {
            address: message.delegator_address,
          },
        ];

        parsedTransaction.validators = {
          target: {
            address: message.validator_address,
            amount: BigInt(message.amount.amount),
          },
        };

        break;
      }
      case "/cosmos-distribution-v1beta1-MsgWithdrawDelegatorReward": {
        const message = tx.body.messages[0]["/cosmos-distribution-v1beta1-MsgWithdrawDelegatorReward"]!;

        // Multiple reward amounts will be crammed in the 'value' string, e.g:
        // "value": "104ibc/D41ECC8FEF1B7E9C4BCC58B1362588420853A9D0B898EDD513D9B79AFFA195C8,5ibc/E92E07E68705FAD13305EE9C73684B30A7B66A52F54C9890327E0A4C0F1D22E3,...,84047uatom"
        const withdrawEvent = mintscanTransaction.logs[0].events.find(
          (event) => event.type === "withdraw_rewards"
        );
        const amounts = withdrawEvent?.attributes.find((attr) => attr.key === "amount")?.value;

        // So we parse it to only get native rewards at the moment, IBC rewards are not supported for now
        // TODO Support IBC rewards
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
      }
    }

    transactions.push({
      parsed: parsedTransaction,
    });
  }

  return {
    chainId: this.chainId,
    accountId,
    transactions: [],
  };
}

export { getAccountHistory };
