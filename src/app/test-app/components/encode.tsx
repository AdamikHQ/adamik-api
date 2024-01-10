import { memo, useCallback, useEffect } from "react";
import { API } from "../shared";

type Props = {
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
  setEncodedTransaction: (value: any) => void;
  setError: (value: any) => void;
};

function Encode({ props }: { props: Props }) {
  const {
    transactionMode,
    sender,
    recipient,
    setRecipient,
    amount,
    setAmount,
    useMaxAmount,
    setUseMaxAmount,
    plainTransaction,
    setComputedAmount,
    setFees,
    setEncodedTransaction,
    setError,
  } = props;

  useEffect(() => {
    useMaxAmount ? setAmount("") : setAmount("1000");
  }, [useMaxAmount]);

  const encode = useCallback(async () => {
    setError("");
    setComputedAmount("");
    setFees("");
    setEncodedTransaction("");

    fetch(`${API}/transaction/encode`, {
      method: "POST",
      body: JSON.stringify({ transaction: plainTransaction }),
    }).then(async (response) => {
      if (response.status === 200) {
        const data = await response.json();
        if (data?.status?.errors?.length) {
          // TODO Display all errors
          // TODO Display warnings
          setError(`Error! ${data.status.errors[0].message}`);
        } else {
          if (typeof data?.plain?.amount === "string") {
            setComputedAmount(data.plain.amount);
          }
          if (typeof data?.plain?.fees === "string") {
            setFees(data.plain.fees);
          }
          if (typeof data?.encoded === "string") {
            setEncodedTransaction(data.encoded);
          }
        }
      } else {
        console.error("encode - backend error:", response.statusText);
        setError(`Error! ${response.statusText}`);
      }
    });
  }, [plainTransaction, setComputedAmount, setFees, setEncodedTransaction, setError]);

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
      <input id="sender" className="input-text" value={sender} disabled />
      <br />
      <br />

      <label>Recipient</label>
      <br />
      <input id="recipient" className="input-text" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
      <br />
      <br />

      <label>Amount (in satoshis)</label>
      <br />
      <input
        id="amount"
        className="input-text"
        value={useMaxAmount ? "" : amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={useMaxAmount}
      />
      <input type="checkbox" onChange={(e) => setUseMaxAmount(e.target.checked)} />
      <label>Max</label>
      <br />
      <br />

      <button type="submit" onClick={encode}>
        ENCODE
      </button>
    </div>
  );
}

export default memo(Encode);
