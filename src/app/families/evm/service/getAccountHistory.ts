import BigNumber from "bignumber.js";
import { CHAINS } from "~/app/config/chains";
import {
  AccountHistory,
  AccountHistoryPagination,
  FinalizedTransaction,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { EvmService } from ".";
import { fetchAccountTransactions } from "../backend/moralis";
import { EvmAddress } from "../types";

async function getAccountHistory(
  this: EvmService,
  accountId: string,
  pagination: AccountHistoryPagination
): Promise<AccountHistory> {
  const chain = CHAINS[this.chainId];

  const moralisTransactions = await fetchAccountTransactions(
    this.chainId,
    accountId as EvmAddress,
    pagination
  );

  const transactions: FinalizedTransaction[] = [];

  for (const moralisTransaction of moralisTransactions) {
    // Moralis bug ? For some reason, transaction_fee is NOT in smallest unit... so we need to convert it
    const feesBN = new BigNumber(moralisTransaction.transaction_fee).multipliedBy(
      Math.pow(10, chain.decimals)
    );
    const fees = BigInt(feesBN.toFixed());

    const parsedTransaction: FinalizedTransaction["parsed"] = {
      chainId: this.chainId,
      id: moralisTransaction.hash,
      timestamp: new Date(moralisTransaction.block_timestamp).getTime(),
      senders: [
        {
          address: moralisTransaction.from_address,
        },
      ],
      fees,
      gas: BigInt(moralisTransaction.gas),
      nonce: BigInt(moralisTransaction.nonce),
      // Placeholder values, actual values filled below
      mode: TransactionMode.TRANSFER,
      state: TransactionState.PENDING,
    };

    if (moralisTransaction.block_number) {
      parsedTransaction.state = TransactionState.CONFIRMED;
      parsedTransaction.blockHeight = BigInt(moralisTransaction.block_number);
    }

    if (moralisTransaction.native_transfers?.length) {
      const moralisNativeTransfer = moralisTransaction.native_transfers[0];
      parsedTransaction.mode = TransactionMode.TRANSFER;
      parsedTransaction.recipients = [
        {
          amount: BigInt(moralisNativeTransfer.value),
          address: moralisNativeTransfer.to_address,
        },
      ];
    } else if (moralisTransaction.erc20_transfers?.length) {
      const moralisErc20Transfer = moralisTransaction.erc20_transfers[0];
      parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
      parsedTransaction.tokenId = moralisErc20Transfer.address;
      parsedTransaction.recipients = [
        {
          amount: BigInt(moralisErc20Transfer.value),
          address: moralisErc20Transfer.to_address,
        },
      ];
    }

    transactions.push({
      parsed: parsedTransaction,
    });
  }

  return {
    chainId: this.chainId,
    accountId,
    transactions,
  };
}

export { getAccountHistory };
