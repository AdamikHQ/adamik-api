import { AccountState } from "~/app/model/types_WIP";
import { fetchAccountData as fetchAccountDataFromOklink } from "../backend/oklink";
import { fetchAccountData as fetchAccountDataFromTronscan } from "../backend/tronscan";

import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { TronService } from "../service";

async function getAccountState(this: TronService, accountId: string): Promise<AccountState> {
  const fetchAccountDataFunctions = [fetchAccountDataFromTronscan, fetchAccountDataFromOklink];

  const errors: Error[] = [];

  for (const fetchAccountDataFunction of fetchAccountDataFunctions) {
    try {
      return await fetchAccountDataFunction(accountId);
    } catch (error) {
      errors.push(error as Error);
      continue; // Try next service if available
    }
  }

  // That's means even failover didn't work
  console.warn(JSON.stringify(errors, null, 2));

  throw new ThirdPartyProviderError("Failed to fetch account state");
}

export { getAccountState };
