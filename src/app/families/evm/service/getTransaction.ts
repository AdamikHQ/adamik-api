import { decodeFunctionData, erc20Abi } from "viem";
import { PastTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { fetchTransaction, fetchTransactionReceipt } from "../backend/node";

async function getTransaction(this: EvmService, transactionId: string): Promise<PastTransaction | null> {
  // NOTE Requires 2 calls to the node
  // In case of perf issues, could be done in 1 call to an explorer e.g. Moralis or Etherscan
  const transaction = await fetchTransaction(this.chainId, transactionId);
  const transactionReceipt = await fetchTransactionReceipt(this.chainId, transactionId);

  const result: Partial<PastTransaction> = {
    chainId: this.chainId,
    senders: [
      {
        address: transaction.from,
      },
    ],
    fees: transactionReceipt.gasUsed * transactionReceipt.effectiveGasPrice,
    gas: transactionReceipt.gasUsed,
    nonce: BigInt(transaction.nonce),
  };

  if (transaction.input) {
    const { functionName, args } = decodeFunctionData({
      abi: erc20Abi,
      data: transaction.input,
    });

    // Misleading, but the "transfer" value here refers to the ERC20 ABI's "transfer" method,
    // which indicates a token transfer not a native transfer
    // See https://ethereum.org/en/developers/docs/standards/tokens/erc-20/#methods
    if (functionName === "transfer") {
      result.mode = TransactionMode.TRANSFER_TOKEN;
      result.recipients = [
        {
          address: args[0],
          amount: args[1],
        },
      ];
    } else {
      // TODO Handle transactions that interact with other things than ERC20 contracts
      return null;
    }
  } else {
    result.mode = TransactionMode.TRANSFER;
    result.recipients = [
      {
        address: transaction.to || "",
        amount: transaction.value,
      },
    ];
  }

  const log = transactionReceipt.logs[0];
  if (log) {
    result.state = TransactionState.CONFIRMED;
    result.blockHeight = log.blockNumber;
    // @ts-expect-error - apparently Viem doesn't type the blockTimestamp field properly
    result.timestamp = log.blockTimestamp;
  } else {
    result.state = TransactionState.UNCONFIRMED;
  }

  return result as PastTransaction;
}

export { getTransaction };
