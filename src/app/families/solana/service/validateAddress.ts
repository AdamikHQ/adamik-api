import { PublicKey } from "@solana/web3.js";
import { SolanaService } from "../service";

async function validateAddress(this: SolanaService, accountAddress: string) {
  return PublicKey.isOnCurve(accountAddress);
}

export { validateAddress };
