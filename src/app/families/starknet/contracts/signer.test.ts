import { ec, stark } from "starknet";

// This test will only help to provide signature for any transaction on starknet,
// you will need to paste your private key in allow to sign transaction
describe("Signer", () => {
  const randomEmptyPrivateKey = stark.randomAddress(); // TODO: put your private key here

  it.skip("should sign any encoded transaction", async () => {
    const signature = ec.starkCurve.sign(
      "0x1d7f7f41c0549ecbaf6d3337f0730b3c6738da840d6d19c94225350c5900a9e",
      randomEmptyPrivateKey
    );

    console.log(signature.toDERHex());
  });
});
