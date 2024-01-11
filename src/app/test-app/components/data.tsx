import { memo, useCallback } from "react";
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

  const getData = useCallback(async () => {
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
    });
  }, [chainId, sender]);

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

      <button type="submit" onClick={getData}>
        GET DATA
      </button>
    </div>
  );
}

export default memo(Data);
