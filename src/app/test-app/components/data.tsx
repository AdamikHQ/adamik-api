import { memo, useState, useCallback } from "react";
import { API_URL, AUTH_HEADER, Chain, amountToMainUnit } from "../shared";

type Props = {
  chain: Chain;
  sender: string;
  setSender: (value: any) => void;
  balance: string;
  setBalance: (value: any) => void;
  setError: (value: any) => void;
};

function Data({ props }: { props: Props }) {
  const { chain, sender, setSender, balance, setBalance, setError } = props;

  const [loading, setLoading] = useState(false);

  const getData = useCallback(async () => {
    setLoading(true);
    setError("");
    setBalance("");

    fetch(`${API_URL}/data/state`, {
      headers: AUTH_HEADER,
      method: "POST",
      body: JSON.stringify({ chainId: chain.id, address: sender }),
    }).then(async (response) => {
      if (response.status === 200) {
        const data = await response.json();
        if (typeof data?.balances?.available === "string") {
          setBalance(data.balances.available);
        }
      } else {
        console.error("state - backend error:", response.statusText);
        setError(`Error! ${response.statusText}`);
      }
      setLoading(false);
    });
  }, [chain, sender, setBalance, setError]);

  return (
    <div className="section">
      <label>Address</label>
      <br />
      <input id="address" className="input-text" value={sender} onChange={(e) => setSender(e.target.value)} />
      <br />
      <br />

      <label>Balance (in {chain.ticker})</label>
      <br />
      <div>{amountToMainUnit(balance, chain.magnitude)}</div>
      <br />

      <div className="vertically-centered">
        <button disabled={loading || !chain.id} type="submit" onClick={getData}>
          GET DATA
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

export default memo(Data);
