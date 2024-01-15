import { memo, useCallback } from "react";
import { KEYRINGS } from "../shared";

type Props = {
  chainId: string;
  sender: string;
  computedAmount: string;
  fees: string;
  gas: string;
  encodedTransaction: string;
  setSignature: (value: any) => void;
  setError: (value: any) => void;
};

function Sign({ props }: { props: Props }) {
  const { chainId, computedAmount, fees, gas, encodedTransaction, setSignature, setError } = props;

  const sign = useCallback(async () => {
    setError("");
    setSignature("");

    try {
      const keyring = KEYRINGS.get(chainId);
      if (!keyring) {
        throw new Error(`No keyring for chain: ${chainId}`);
      }

      const { signature: signatureBuffer } = await keyring.signTransaction({
        transaction: encodedTransaction,
      });

      signatureBuffer && setSignature(signatureBuffer.toString("hex"));
    } catch (e) {
      console.error("sign - signTransaction error:", e);
      setError(`Error! ${e}`);
    }
  }, [chainId, encodedTransaction, setSignature, setError]);

  return (
    <div className="section">
      <label>Amount (in satoshis)</label>
      <br />
      <div>{computedAmount}</div>
      <br />

      <label>Fees (in satoshis)</label>
      <br />
      <div>{fees}</div>
      <br />

      <label>Gas (in satoshis)</label>
      <br />
      <div>{gas}</div>
      <br />

      <label>Encoded transaction</label>
      <br />
      <div className="text">{encodedTransaction}</div>
      <br />

      <button disabled={!encodedTransaction.length} type="submit" onClick={sign}>
        SIGN
      </button>
    </div>
  );
}

export default memo(Sign);
