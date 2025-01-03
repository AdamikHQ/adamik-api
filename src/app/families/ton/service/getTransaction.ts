import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchTransaction } from "../backend/tonapi";
import { TonService } from "../service";

async function getTransaction(this: TonService, transactionId: string): Promise<FinalizedTransaction> {
  const tonTransaction = await fetchTransaction(transactionId);
  if (!tonTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  let parsedTransaction: FinalizedTransaction["parsed"] = {
    id: tonTransaction.hash,
    fees: {
      amount: BigInt(tonTransaction.totalFees || 0n),
    },
    // Placeholder values, actual values filled below
    mode: TransactionMode.TRANSFER,
    state: TransactionState.UNKNOWN,
  };

  parsedTransaction.timestamp = new Date(tonTransaction.outMsgs[0].createdAt * 1000).getTime();

  // TON block value is weirdly formatted (e.g: "(0,8000000000000000,26209049)")
  // Assuming our block height is the last of the three values...
  const tonBlockId = tonTransaction.block
    .slice(1, tonTransaction.block.length - 1) // remove the parenthesis
    .split(",") // split the 3 values
    .pop(); // get the last one

  parsedTransaction.blockHeight = tonBlockId ? BigInt(tonBlockId) : undefined;
  parsedTransaction.state = tonBlockId
    ? tonTransaction.success
      ? TransactionState.CONFIRMED
      : TransactionState.FAILED
    : TransactionState.PENDING;

  if (tonTransaction.inMsg?.decodedOpName === "text_comment") {
    parsedTransaction.memo = tonTransaction.inMsg?.decodedBody.text;
  }

  if (tonTransaction.outMsgs[0].decodedOpName === "jetton_transfer") {
    parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;

    // TODO: parsedTransaction.tokenId

    parsedTransaction.senders = [
      {
        address: tonTransaction.account.address.toString() || "",
        amount: BigInt(tonTransaction.outMsgs[0].decodedBody.amount),
      },
    ];

    parsedTransaction.recipients = [
      {
        address: tonTransaction.outMsgs[0].decodedBody.destination,
        amount: BigInt(tonTransaction.outMsgs[0].decodedBody.amount),
      },
    ];
  } else {
    parsedTransaction.senders = [
      {
        address: tonTransaction.account.address.toString() || "",
        amount: BigInt(tonTransaction.inMsg?.value || 0n),
      },
    ];

    parsedTransaction.recipients = [
      {
        address: tonTransaction.outMsgs[0]?.destination?.address.toString() || "",
        amount: BigInt(tonTransaction.inMsg?.value || 0n),
      },
    ];
  }

  return {
    parsed: parsedTransaction,
    raw: tonTransaction,
  };
}

export { getTransaction };
