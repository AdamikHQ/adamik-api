import { decodeFunctionData, erc20Abi } from "viem";
import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { fetchTransaction, fetchTransactionReceipt } from "../backend/node";

async function getTransaction(this: EvmService, transactionId: string): Promise<FinalizedTransaction | null> {
  // NOTE Requires 2 calls to the node
  // In case of perf issues, could be done in 1 call to an explorer e.g. Moralis or Etherscan
  const evmTransaction = await fetchTransaction(this.chainId, transactionId);
  const evmTransactionReceipt = await fetchTransactionReceipt(this.chainId, transactionId);

  if (!evmTransaction || !evmTransactionReceipt) {
    return null;
  }

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId: this.chainId,
    id: evmTransaction.hash,
    senders: [
      {
        address: evmTransaction.from,
      },
    ],
    fees: evmTransactionReceipt.gasUsed * evmTransactionReceipt.effectiveGasPrice,
    gas: evmTransactionReceipt.gasUsed,
    nonce: BigInt(evmTransaction.nonce),
    // Placeholder values, actual values filled below
    mode: TransactionMode.TRANSFER,
    state: TransactionState.UNKNOWN,
    recipients: [],
  };

  if (evmTransaction.input && evmTransaction.input !== "0x") {
    const { functionName, args } = decodeFunctionData({
      abi: erc20Abi,
      data: evmTransaction.input,
    });

    // Misleading, but the "transfer" value here refers to the ERC20 ABI's "transfer" method,
    // which indicates a token transfer not a native transfer
    // See https://ethereum.org/en/developers/docs/standards/tokens/erc-20/#methods
    if (functionName === "transfer") {
      parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
      parsedTransaction.recipients = [
        {
          address: args[0],
          amount: args[1],
        },
      ];
    } else {
      // Not supported (yet?)
      console.warn(`/!\\ Unsupported parsing of transaction ${transactionId} for chainId ${this.chainId}`);
      return {
        raw: evmTransactionReceipt,
      };
    }
  } else {
    parsedTransaction.mode = TransactionMode.TRANSFER;
    parsedTransaction.recipients = [
      {
        address: evmTransaction.to || "",
        amount: evmTransaction.value,
      },
    ];
  }

  const log = evmTransactionReceipt.logs[0];
  if (log) {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = log.blockNumber;
    // FIXME Apparently there are no logs for simple transfer transactions,
    // so blockTimestamp isn't avaialble for these :/
    // Skipped for now, but could be retrieved with an additional getBlock call to the node...
    // or by relying on the explorer instead
    // @ts-expect-error (looks like Viem doesn't type the blockTimestamp field properly)
    parsedTransaction.timestamp = log.blockTimestamp;
  } else if (evmTransaction.blockNumber !== null) {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = BigInt(evmTransaction.blockNumber);
  } else {
    parsedTransaction.state = TransactionState.UNCONFIRMED;
  }

  return {
    parsed: parsedTransaction,
    raw: evmTransactionReceipt,
  };
}

export { getTransaction };
