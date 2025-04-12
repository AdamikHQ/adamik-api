import { fetchBabylonStakingData } from "~/app/families/babylon/backend/babylonAPI";
import { AccountState, ChainId } from "~/app/model/types_WIP";
import { getAccountStatefromProviders } from "../../common";
import {
  fetchAddressData as fetchAddressDataFromBlockchair,
  fetchXpubData as fetchXpubDataFromBlockchair,
} from "../backend/blockchair";
import { fetchAddressData as fetchAddressDataFromMS } from "../backend/mempoolSpace";
import { isValidPubKey, isValidXpub } from "../logic";
import { BitcoinService } from "../service";
import { Xpub } from "../types";

async function getAccountState(
  this: BitcoinService,
  accountId: string,
  pubKey?: string
): Promise<AccountState> {
  const state: AccountState = { balances: {} };

  state.balances.native = isValidXpub(this.chainId, accountId)
    ? await getXpubNativeBalances(this.chainId, accountId)
    : await getAddressNativeBalances(this.chainId, accountId);

  if (pubKey && isValidPubKey(this.chainId, pubKey)) {
    state.balances.staking = await getBabylonStakingState(this.chainId, pubKey);
  }

  return state;
}

async function getAddressNativeBalances(
  chainId: ChainId,
  address: string
): Promise<AccountState["balances"]["native"]> {
  const fetchAccountDataFunctions = [fetchAddressDataFromBlockchair, fetchAddressDataFromMS];

  const nativeState = await getAccountStatefromProviders(chainId, address, fetchAccountDataFunctions);
  return nativeState.balances.native;
}

// NOTE mempool.space API doesn't support xpubs,
// so blockchair is currently the only provider for xpubs
async function getXpubNativeBalances(
  chainId: ChainId,
  xpub: Xpub
): Promise<AccountState["balances"]["native"]> {
  const nativeState = await fetchXpubDataFromBlockchair(chainId, xpub);
  return nativeState.balances.native;
}

async function getBabylonStakingState(
  chainId: ChainId,
  pubKeyHex: string
): Promise<AccountState["balances"]["staking"]> {
  const stakingState = await fetchBabylonStakingData(pubKeyHex);
  return stakingState.balances.staking;
}

export { getAccountState };
