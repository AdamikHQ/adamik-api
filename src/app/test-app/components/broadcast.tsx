import { memo, useState, useCallback } from "react";
import { API_URL, AUTH_HEADER, Chain } from "../shared";

type Props = {
  chain: Chain;
  plainTransaction: unknown;
  encodedTransaction: string;
  signature: string;
  setTransactionHash: (value: any) => void;
  setError: (value: any) => void;
};

function Broadcast({ props }: { props: Props }) {
  const { chain, plainTransaction, encodedTransaction, signature, setTransactionHash, setError } = props;

  const [loading, setLoading] = useState(false);

  const broadcast = useCallback(async () => {
    setLoading(true);
    setError("");
    setTransactionHash("");

    const response = await fetch(`${API_URL}/transaction/broadcast`, {
      headers: AUTH_HEADER,
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
      setError(`Error! ${JSON.stringify(response.error)}`);
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
        <button disabled={loading || !chain.id} type="submit" onClick={broadcast}>
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
