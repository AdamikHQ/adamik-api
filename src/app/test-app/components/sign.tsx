import { memo, useState, useCallback, useEffect } from "react";
import { Keyring } from "../keyring/types";
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

  const [loading, setLoading] = useState(false);
  const [keyring, setKeyring] = useState<Keyring | undefined>(undefined);

  useEffect(() => {
    setKeyring(KEYRINGS.get(chainId));
  }, [chainId]);

  const sign = useCallback(async () => {
    setLoading(true);
    setError("");
    setSignature("");

    try {
      if (!keyring) {
        throw new Error(`No keyring for chain: ${chainId}`);
      }

      const { signature: signatureBuffer } = await keyring.signTransaction({
        transaction: encodedTransaction,
      });

      if (signatureBuffer) {
        signatureBuffer && setSignature(signatureBuffer.toString("hex"));
      } else {
        console.error("scan - no address returned");
        setError(`Error! No signature returned. Wrong app?`);
      }
    } catch (e) {
      console.error("sign - signTransaction error:", e);
      setError(`Error! App returned an error. Wrong app?`);
    }
    setLoading(false);
  }, [chainId, keyring, encodedTransaction, setSignature, setError]);

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

      <div className="vertically-centered">
        <button disabled={loading || !encodedTransaction.length} type="submit" onClick={sign}>
          SIGN
        </button>
        {loading && (
          <div className={"lds-ellipsis"}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Sign);
