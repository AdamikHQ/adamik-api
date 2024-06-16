import { CosmosService } from ".";

// https://github.com/cosmos/cosmos-sdk/blob/main/docs/architecture/adr-028-public-key-addresses.md
// https://github.com/cosmos/cosmjs/wiki/What-can-CosmJS-do-for-me%3F
async function pubkeyToAddress(this: CosmosService, pubkey: string): Promise<string> {
  // TODO
  throw new Error("Not implemented");

  /*
  import { pubkeyToAddress } from "@cosmjs/amino";

  const pubkey = {
    type: "tendermint/PubKeySecp256k1",
    value: "AtQaCqFnshaZQp6rIkvAPyzThvCvXSDO+9AzbxVErqJP",
  };
  const address = pubkeyToAddress(pubkey, "cosmos");
  console.log(address); // cosmos1h806c7khnvmjlywdrkdgk2vrayy2mmvf9rxk2r
  */
}

export { pubkeyToAddress };
