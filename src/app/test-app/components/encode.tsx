import { memo, useState, useCallback, useEffect } from "react";
import { API_URL, AUTH_HEADER, Chain } from "../shared";

type Props = {
  chain: Chain;
  transactionMode: string;
  sender: string;
  setSender: (value: any) => void;
  recipient: string;
  setRecipient: (value: any) => void;
  amount: string;
  setAmount: (value: any) => void;
  useMaxAmount: boolean;
  setUseMaxAmount: (value: any) => void;
  plainTransaction: unknown;
  setComputedAmount: (value: any) => void;
  setFees: (value: any) => void;
  setGas: (value: any) => void;
  setEncodedTransaction: (value: any) => void;
  setError: (value: any) => void;
};

function Encode({ props }: { props: Props }) {
  const {
    chain,
    transactionMode,
    sender,
    setSender,
    recipient,
    setRecipient,
    amount,
    setAmount,
    useMaxAmount,
    setUseMaxAmount,
    plainTransaction,
    setComputedAmount,
    setFees,
    setGas,
    setEncodedTransaction,
    setError,
  } = props;

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAmount("");
  }, [useMaxAmount, setAmount]);

  const encode = useCallback(async () => {
    setLoading(true);
    setError("");
    setComputedAmount("");
    setFees("");
    setGas("");
    setEncodedTransaction("");

    fetch(`${API_URL}/transaction/encode`, {
      headers: AUTH_HEADER,
      method: "POST",
      body: JSON.stringify({ transaction: { plain: plainTransaction } }),
    }).then(async (response) => {
      if (response.status === 200) {
        const { transaction } = await response.json();
        if (transaction?.status?.errors?.length) {
          // TODO Display all errors
          // TODO Display warnings
          setError(`Error! ${transaction.status.errors[0].message}`);
        } else {
          if (typeof transaction?.plain?.amount === "string") {
            setComputedAmount(transaction.plain.amount);
          }
          if (typeof transaction?.plain?.fees === "string") {
            setFees(transaction.plain.fees);
          }
          if (typeof transaction?.plain?.gas === "string") {
            setGas(transaction.plain.gas);
          }
          if (typeof transaction?.encoded === "string") {
            setEncodedTransaction(transaction.encoded);
          }
        }
      } else {
        console.error("encode - backend error:", response.statusText);
        setError(`Error! ${response.statusText}`);
      }
      setLoading(false);
    });
  }, [plainTransaction, setComputedAmount, setFees, setGas, setEncodedTransaction, setError]);

  return (
    <div className="section">
      <label>Transaction Mode</label>
      <br />
      <select defaultValue={transactionMode} disabled id="tx-mode">
        <option value="transfer">transfer</option>
        <option value="stake">stake</option>
      </select>
      <br />
      <br />

      <label>Sender</label>
      <br />
      <input id="sender" className="input-text" value={sender} onChange={(e) => setSender(e.target.value)} />
      <br />
      <br />

      <label>Recipient</label>
      <br />
      <input
        id="recipient"
        className="input-text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <br />
      <br />

      <label>Amount (in {chain.units[0].name})</label>
      <br />
      <input
        id="amount"
        className="input-text"
        value={useMaxAmount ? "" : amount}
        onChange={(e) => {
          if (!isNaN(+e.target.value)) {
            setAmount(e.target.value);
          }
        }}
        disabled={useMaxAmount}
      />
      <input type="checkbox" onChange={(e) => setUseMaxAmount(e.target.checked)} />
      <label>Max</label>
      <br />
      <br />

      <div className="vertically-centered">
        <button disabled={loading || !chain.id} type="submit" onClick={encode}>
          ENCODE
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

export default memo(Encode);
