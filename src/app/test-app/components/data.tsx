import { memo, useState, useCallback } from "react";
import { API } from "../shared";

type Props = {
  chainId: string;
  sender: string;
  setSender: (value: any) => void;
  balance: string;
  setBalance: (value: any) => void;
  setError: (value: any) => void;
};

function Data({ props }: { props: Props }) {
  const { chainId, sender, setSender, balance, setBalance, setError } = props;

  const [loading, setLoading] = useState(false);

  const getData = useCallback(async () => {
    setLoading(true);
    setError("");
    setBalance("");

    fetch(`${API}/data/state`, {
      method: "POST",
      body: JSON.stringify({ chain: chainId, address: sender }),
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
  }, [chainId, sender, setBalance, setError]);

  return (
    <div className="section">
      <label>Address</label>
      <br />
      <input id="address" className="input-text" value={sender} onChange={(e) => setSender(e.target.value)} />
      <br />
      <br />

      <label>Balance (in satoshis)</label>
      <br />
      <div>{balance}</div>
      <br />

      <div className="vertically-centered">
        <button disabled={loading} type="submit" onClick={getData}>
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
