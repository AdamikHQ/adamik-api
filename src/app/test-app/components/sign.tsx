import { memo, useCallback } from "react";
import { KEYRINGS } from "../shared";

type Props = {
  chainId: string;
  sender: string;
  computedAmount: string;
  fees: string;
  encodedTransaction: string;
  setSignature: (value: any) => void;
  setError: (value: any) => void;
};

function Sign({ props }: { props: Props }) {
  const { chainId, sender, computedAmount, fees, encodedTransaction, setSignature, setError } = props;

  const sign = useCallback(async () => {
    setError("");
    setSignature("");

    try {
      const keyring = KEYRINGS.get(chainId);
      if (!keyring) {
        throw new Error(`No keyring for chain: ${chainId}`);
      }

      // FIXME Is path: sender really ok? Or should we use actual path?
      const { signature: signatureBuffer } = await keyring.sign({
        path: sender,
        message: encodedTransaction,
      });

      signatureBuffer && setSignature(signatureBuffer.toString("hex"));
    } catch (e) {
      console.error("sign - signature error:", e);
      setError(`Error! ${e}`);
      return;
    }
  }, [chainId, sender, encodedTransaction, setSignature, setError]);

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
