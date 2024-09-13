import { AccountState, TokenType } from "~/app/model/types_WIP";
import { TonService } from ".";
import { fetchAccount, getJettonsFromWallet } from "../backend/explorer";

async function getAccountState(this: TonService, accountId: string): Promise<AccountState> {
  const accountInfo = await fetchAccount(accountId);

  const nativeBalance = BigInt(accountInfo.balance);

  const jettons = await getJettonsFromWallet(accountId);

  const tokenAmounts = jettons?.balances.map((balance) => {
    return {
      token: {
        chainId: this.chainId,
        type: TokenType.JETTON,
        id: balance.jetton.address.toString(),
        name: balance.jetton.name,
        ticker: balance.jetton.symbol,
        decimals: balance.jetton.decimals,
        logo: balance.jetton.image,
      },
      amount: BigInt(balance.balance),
    };
  });

  return {
    chainId: this.chainId,
    accountId: accountId,
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      ...(tokenAmounts && { tokens: tokenAmounts }),
    },
  };
}

export { getAccountState };
