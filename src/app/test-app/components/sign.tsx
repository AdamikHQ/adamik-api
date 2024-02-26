import { memo, useState, useCallback, useEffect } from "react";
import { Keyring } from "../keyring/types";
import { Chain, KEYRINGS, amountToMainUnit } from "../shared";

type Props = {
  chain: Chain;
  sender: string;
  computedAmount: string;
  fees: string;
  gas: string;
  encodedTransaction: string;
  setSignature: (value: any) => void;
  setError: (value: any) => void;
};

function Sign({ props }: { props: Props }) {
  const { chain, computedAmount, fees, gas, encodedTransaction, setSignature, setError } = props;

  const [loading, setLoading] = useState(false);
  const [keyring, setKeyring] = useState<Keyring | undefined>(undefined);

  useEffect(() => {
    setKeyring(KEYRINGS.get(chain.id));
  }, [chain.id]);

  const sign = useCallback(async () => {
    setLoading(true);
    setError("");
    setSignature("");

    try {
      if (!keyring) {
        throw new Error(`No keyring for chain: ${chain.id}`);
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
  }, [chain.id, keyring, encodedTransaction, setSignature, setError]);

  return (
    <div className="section">
      <label>Amount (in {chain.ticker})</label>
      <br />
      <div>{amountToMainUnit(computedAmount, chain.magnitude)}</div>
      <br />

      <label>Fees (in {chain.ticker})</label>
      <br />
      <div>{amountToMainUnit(fees, chain.magnitude)}</div>
      <br />

      <label>Gas (in {chain.ticker})</label>
      <br />
      <div>{amountToMainUnit(gas, chain.magnitude)}</div>
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
