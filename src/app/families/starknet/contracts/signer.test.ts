import { ec } from "starknet";

// This test will only help to provide signature for any transaction on starknet,
// you will need to paste your private key in allow to sign transaction
describe("Signer", () => {
  const randomEmptyPrivateKey = "0x07b3a10780ac438774198115b0663c25a577128fa9db74a278a2db9ff6a3ce3e"; // TODO: put your private key here

  it.only("should sign any encoded transaction", async () => {
    const signature = ec.starkCurve.sign(
      "0x4868cea0a6499e9baf11c98089fb71d5956c0268baa4364bc0bbdd12b7e99f0",
      randomEmptyPrivateKey
    );

    console.log(signature.toDERHex());
  });
});
