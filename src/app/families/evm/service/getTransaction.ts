import { decodeFunctionData, erc20Abi } from "viem";
import { FinalizedTransaction, Status, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { EvmService } from ".";
import { fetchTransaction, fetchTransactionReceipt } from "../backend/node";

async function getTransaction(
  this: EvmService,
  transactionId: string,
  status: Status
): Promise<FinalizedTransaction> {
  // NOTE Requires 2 calls to the node
  // In case of perf issues, could be done in 1 call to an explorer e.g. Moralis or Etherscan
  const evmTransaction = await fetchTransaction(this.chainId, transactionId);
  const evmTransactionReceipt = await fetchTransactionReceipt(this.chainId, transactionId);

  if (!evmTransaction || !evmTransactionReceipt) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  // Concatenate the 2 to return all their data as the raw transaction
  (evmTransaction as any).transactionReceipt = evmTransactionReceipt;

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId: this.chainId,
    id: evmTransaction.hash,
    senders: [
      {
        address: evmTransaction.from,
      },
    ],
    fees: {
      amount: evmTransactionReceipt.gasUsed * evmTransactionReceipt.effectiveGasPrice,
    },
    gas: evmTransactionReceipt.gasUsed,
    nonce: BigInt(evmTransaction.nonce),
    // Placeholder values, actual values filled below
    mode: "unknown",
    state: TransactionState.UNKNOWN,
    recipients: [
      {
        address: evmTransaction.to || "",
        amount: evmTransaction.value,
      },
    ],
  };

  const log = evmTransactionReceipt.logs[0];
  if (log) {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = log.blockNumber;
    // FIXME Seems that sometimes there are no logs for simple transfer transactions (?)
    // so blockTimestamp isn't avaialble for these :/
    // Skipped for now, but could be retrieved with an additional getBlock call to the node...
    // or by relying on the explorer instead
    // @ts-expect-error (looks like Viem doesn't type the blockTimestamp field properly)
    parsedTransaction.timestamp = log.blockTimestamp && Number(log.blockTimestamp) * 1000;
  } else if (evmTransaction.blockNumber !== null) {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = BigInt(evmTransaction.blockNumber);
  } else {
    parsedTransaction.state = TransactionState.UNCONFIRMED;
  }

  // For other data, we only support EIP1559 transactions at the moment
  if (evmTransaction.type === "eip1559") {
    // Empty input (data) means simple transfer
    if (evmTransaction.input === "0x") {
      parsedTransaction.mode = TransactionMode.TRANSFER;
    } else {
      const { functionName, args } = decodeFunctionData({
        abi: erc20Abi,
        data: evmTransaction.input,
      });

      // Misleading, but the "transfer" value here refers to the ERC20 ABI's "transfer" method,
      // which indicates a token transfer not a native transfer
      // See https://ethereum.org/en/developers/docs/standards/tokens/erc-20/#methods
      if (functionName === "transfer") {
        parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
        parsedTransaction.tokenId = evmTransaction.to!;
        parsedTransaction.recipients = [
          {
            address: args[0],
            amount: args[1],
          },
        ];
      }
    }
  }

  if (parsedTransaction.mode === "unknown") {
    // Not supported (yet?)
    const message = `Unsupported parsing of transaction ${transactionId} for chainId ${this.chainId}`;
    console.warn(message);
    status.warnings.push({ message });
  }

  return {
    parsed: parsedTransaction,
    raw: evmTransaction,
  };
}

export { getTransaction };
