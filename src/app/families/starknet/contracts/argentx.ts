import {
  Account,
  CairoCustomEnum,
  CairoOption,
  CairoOptionVariant,
  CallData,
  DeployAccountContractTransaction,
  encode,
  hash,
  InvocationsDetailsWithNonce,
  Provider,
  stark,
} from "starknet";
import { CHAINS } from "~/app/config/chains";
import { deployContractPayload, generateAddress } from "./types";

const ArgentXAccountClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";

class ArgentX {
  static generateAddress: generateAddress = (pubkey: string): string => {
    const axSigner = new CairoCustomEnum({ Starknet: { pubkey: pubkey } });
    const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);
    const AXConstructorCallData = CallData.compile({
      owner: axSigner,
      guardian: axGuardian,
    });

    const AXcontractAddress = hash.calculateContractAddressFromHash(
      pubkey,
      ArgentXAccountClassHash,
      AXConstructorCallData,
      0
    );
    return encode.sanitizeHex(AXcontractAddress);
  };

  static deployContractPayload: deployContractPayload = async (
    pubkey: string
  ): Promise<{
    payload: Omit<DeployAccountContractTransaction, "signature"> & {
      toSign: string;
    };
    details: InvocationsDetailsWithNonce;
  }> => {
    const provider = new Provider({
      nodeUrl: CHAINS.starknet.backends.nodeURL,
    });

    const account = new Account(provider, ArgentXAccountClassHash, stark.randomAddress());

    const axSigner = new CairoCustomEnum({ Starknet: { pubkey: pubkey } });
    const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);
    const AXConstructorCallData = CallData.compile({
      owner: axSigner,
      guardian: axGuardian,
    });

    const payload = await account.getDeployAccountPayloadToSign(
      {
        classHash: ArgentXAccountClassHash,
        addressSalt: pubkey,
        constructorCalldata: AXConstructorCallData,
      },
      { version: "0x3" } // version 3
    );

    return payload;
  };
}

export { ArgentX };
