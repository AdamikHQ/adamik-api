import { memo, useState, useCallback } from "react";
import { API } from "../shared";

type Props = {
  plainTransaction: unknown;
  encodedTransaction: string;
  signature: string;
  setTransactionHash: (value: any) => void;
  setError: (value: any) => void;
};

function Broadcast({ props }: { props: Props }) {
  const { plainTransaction, encodedTransaction, signature, setTransactionHash, setError } = props;

  const [loading, setLoading] = useState(false);

  const broadcast = useCallback(async () => {
    setLoading(true);
    setError("");
    setTransactionHash("");

    const response = await fetch(`${API}/transaction/broadcast`, {
      method: "POST",
      body: JSON.stringify({
        transaction: {
          plain: plainTransaction,
          encoded: encodedTransaction,
          signature,
        },
      }),
    }).then(async (response) => {
      if (response.status === 200) {
        return await response.json();
      } else {
        console.error("broadcast - backend error:", response.statusText);
        setError(`Error! ${response.statusText}`);
      }
    });

    if (response?.error) {
      console.error("broadcast - backend error:", response.error);
      setError(`Error! ${response.error}`);
    } else if (typeof response?.hash === "string") {
      setTransactionHash(response.hash);
    }
    setLoading(false);
  }, [plainTransaction, encodedTransaction, signature, setTransactionHash, setError]);

  return (
    <div className="section">
      <label>Signature</label>
      <br />
      <div className="text">{signature}</div>
      <br />

      <div className="vertically-centered">
        <button disabled={loading} type="submit" onClick={broadcast}>
          BROADCAST
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

export default memo(Broadcast);
