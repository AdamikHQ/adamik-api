import { TronWeb } from "tronweb";
import { TRONGRID_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";

const tronWeb = new TronWeb({
  fullHost: `${CHAINS.tron.backends.nodeURL}`,
  headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY },
});

const getAccount = async (address: string) => {
  const account = await tronWeb.trx.getAccount(address);
  return account;
};

const broadcast = async (signedTransaction: string) => {
  const result = await tronWeb.trx.sendHexTransaction(signedTransaction);
  return result.txid;
};

export { broadcast, getAccount };
