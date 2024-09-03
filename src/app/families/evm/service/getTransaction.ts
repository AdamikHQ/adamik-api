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

  const finalizedTransaction: FinalizedTransaction = {
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

  if (evmTransaction.input) {
    const { functionName, args } = decodeFunctionData({
      abi: erc20Abi,
      data: evmTransaction.input,
    });

    // Misleading, but the "transfer" value here refers to the ERC20 ABI's "transfer" method,
    // which indicates a token transfer not a native transfer
    // See https://ethereum.org/en/developers/docs/standards/tokens/erc-20/#methods
    if (functionName === "transfer") {
      finalizedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
      finalizedTransaction.recipients = [
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
    finalizedTransaction.mode = TransactionMode.TRANSFER;
    finalizedTransaction.recipients = [
      {
        address: evmTransaction.to || "",
        amount: evmTransaction.value,
      },
    ];
  }

  const log = evmTransactionReceipt.logs[0];
  if (log) {
    finalizedTransaction.state = TransactionState.CONFIRMED;
    finalizedTransaction.blockHeight = log.blockNumber;
    // @ts-expect-error - apparently Viem doesn't type the blockTimestamp field properly
    finalizedTransaction.timestamp = log.blockTimestamp;
  } else {
    finalizedTransaction.state = TransactionState.UNCONFIRMED;
  }

  return finalizedTransaction;
}

export { getTransaction };
