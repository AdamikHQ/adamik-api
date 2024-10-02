import { AccountState } from "~/app/model/types_WIP";
import { TronService } from ".";
import { getAccount } from "../backend/node";

async function getAccountState(this: TronService, accountId: string): Promise<AccountState> {
  const accountInfo = await getAccount(accountId);

  console.log(JSON.stringify(accountInfo, null, 2));

  const nativeBalance = accountInfo?.balance ? BigInt(accountInfo.balance) : BigInt(0);

  return {
    chainId: this.chainId,
    accountId: accountId,
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
    },
  };
}

export { getAccountState };
