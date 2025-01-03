import { AccountState, Token, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { fetchAccount, getJettonsFromWallet } from "../backend/tonapi";
import { TonService } from "../service";

async function getAccountState(this: TonService, accountId: string): Promise<AccountState> {
  const accountInfo = await fetchAccount(accountId);

  const nativeBalance = BigInt(accountInfo.balance);

  const jettons = await getJettonsFromWallet(accountId);

  const tokenAmounts: TokenAmount[] = jettons.balances.map((balance) => {
    const token: Token = {
      type: TokenType.JETTON,
      id: balance.jetton.address.toString(),
      name: balance.jetton.name,
      ticker: balance.jetton.symbol,
      decimals: balance.jetton.decimals,
      logo: balance.jetton.image,
    };

    return {
      token,
      amount: BigInt(balance.balance),
    };
  });

  return {
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens: tokenAmounts,
    },
  };
}

export { getAccountState };
