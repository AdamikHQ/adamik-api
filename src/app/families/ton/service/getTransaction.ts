import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { TonService } from ".";
import { fetchTransaction } from "../backend/explorer";

async function getTransaction(this: TonService, transactionId: string): Promise<FinalizedTransaction> {
  const tonTransaction = await fetchTransaction(transactionId);
  if (!tonTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  let parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId: this.chainId,
    id: tonTransaction.hash,
    fees: BigInt(tonTransaction.totalFees || 0n),
    // Placeholder values, actual values filled below
    mode: TransactionMode.TRANSFER,
    state: TransactionState.UNCONFIRMED,
    senders: [],
  };

  // We will need to find a transaction with PENDING;
  if (tonTransaction.success === false) {
    parsedTransaction.state = TransactionState.FAILED;
  } else {
    parsedTransaction.state = TransactionState.CONFIRMED;
  }

  parsedTransaction.timestamp = new Date(Number(tonTransaction.lt)).getTime();
  if (tonTransaction.inMsg?.decodedOpName === "text_comment") {
    parsedTransaction.memo = tonTransaction.inMsg?.decodedBody.text;
  }

  if (tonTransaction.outMsgs[0].decodedOpName === "jetton_transfer") {
    parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
    // TODO: parsedTransaction.tokenId
    parsedTransaction.senders = [
      {
        address: tonTransaction.outMsgs[0]?.source?.address.toString() || "",
      },
    ];
    parsedTransaction.recipients = [
      {
        address: tonTransaction.outMsgs[0].decodedBody.destination,
        amount: BigInt(tonTransaction.outMsgs[0].decodedBody.amount),
      },
    ];
  } else {
    // TON block value is weirdly formatted (e.g "(0,8000000000000000,26209049)")
    // Assuming our block height is the last of the three values... :
    const tonBlockId = tonTransaction.block
      .slice(1, tonTransaction.block.length - 1) // remove the parenthesis
      .split(",") // split the 3 values
      .pop(); // get the last one

    parsedTransaction.blockHeight = BigInt(tonBlockId || 0n);

    parsedTransaction.senders = [
      {
        address: tonTransaction.inMsg?.source?.address.toString() || "",
      },
    ];

    parsedTransaction.recipients = [
      {
        address: tonTransaction.inMsg?.destination?.address.toString() || "",
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
