import {
  CairoCustomEnum,
  CairoOption,
  CairoOptionVariant,
  CallData,
  encode,
  hash,
  RawArgs,
  Provider as StarknetProvider,
} from "starknet";
import { CHAINS } from "~/app/config/chains";
import { Provider, ProviderType } from "~/app/model/types_WIP";
import { createStarknetAccount, marginFees } from "../logic";
import { StarknetDeployAccountPayload } from "../types";

const ARGENT_X_CLASS_HASH = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";

const nodeUrl = CHAINS.starknet.providers.find((p: Provider) => p.type === ProviderType.node)?.url;

class ArgentX {
  private static getConstructorCallData = (pubkey: string): RawArgs => {
    const axSigner = new CairoCustomEnum({ Starknet: { pubkey: pubkey } });
    const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);
    const AXConstructorCallData = CallData.compile({
      owner: axSigner,
      guardian: axGuardian,
    });

    return AXConstructorCallData;
  };

  static generateAddress = (pubkey: string): string => {
    const AXConstructorCallData = this.getConstructorCallData(pubkey);
    const AXcontractAddress = hash.calculateContractAddressFromHash(
      pubkey,
      ARGENT_X_CLASS_HASH,
      AXConstructorCallData,
      0
    );

    return encode.sanitizeHex(AXcontractAddress);
  };

  static getDeployContractPayload = async (pubkey: string): Promise<StarknetDeployAccountPayload> => {
    const provider = new StarknetProvider({
      nodeUrl,
    });

    const account = await createStarknetAccount(provider, ARGENT_X_CLASS_HASH);

    const sanitizedPubkey = encode.sanitizeHex(pubkey);
    const AXConstructorCallData = this.getConstructorCallData(sanitizedPubkey);

    const payload = await account.getDeployAccountPayloadToSign(
      {
        classHash: ARGENT_X_CLASS_HASH,
        addressSalt: sanitizedPubkey,
        constructorCalldata: AXConstructorCallData,
        contractAddress: ArgentX.generateAddress(sanitizedPubkey),
      },
      { version: "0x3" } // version 3
    );

    return payload;
  };

  static estimateDeployFees = async (pubkey: string): Promise<bigint> => {
    const provider = new StarknetProvider({
      nodeUrl,
    });

    const sanitizedPubkey = encode.sanitizeHex(pubkey);

    const account = await createStarknetAccount(provider, ARGENT_X_CLASS_HASH);

    const AXConstructorCallData = this.getConstructorCallData(sanitizedPubkey);

    const fees = await account.estimateAccountDeployFee({
      classHash: ARGENT_X_CLASS_HASH,
      addressSalt: sanitizedPubkey,
      constructorCalldata: AXConstructorCallData,
      contractAddress: ArgentX.generateAddress(sanitizedPubkey),
    });

    const marginedFees = marginFees(fees.suggestedMaxFee);

    return marginedFees;
  };
}

export { ArgentX };
