"use client";
import { useState, useCallback } from "react";

export default function Page() {
  // FIXME DEBUG TBR
  // const [feedback, setFeedback] = useState("");
  const [backendError, setBackendError] = useState("");

  const [chainId, setChainId] = useState("algorand");
  const [transactionMode, setTransactionMode] = useState("transfer");
  const [sender, setSender] = useState(
    "RGX5XA7DWZOZ5SLG4WQSNIFKIG4CNX4VOH23YCEX56523DQEAL3QL56XZM"
  );
  const [recipient, setRecipient] = useState(
    "5QS7ANKWSK5XI2ZNWN34BA5KQLSZ3FEI2DTSJQIW5IZZZISD3VEHM5ZT2M"
  );
  const [amount, setAmount] = useState("1000");
  const [encodedTransaction, setEncodedTransaction] = useState("");

  const encode = useCallback(async () => {
    const plainTransaction = {
      chain: chainId,
      mode: transactionMode,
      senders: [sender],
      recipients: [recipient],
      amount,
    };
    const response = await fetch(
      `http://localhost:3000/api/transaction/encode`,
      {
        method: "POST",
        body: JSON.stringify({ transaction: plainTransaction }),
      }
    )
      .then((response) => response.json())
      .catch((e) => {
        console.log("XXX - encode - backend error:", e);
        setBackendError("Error!");
      });

    if (typeof response?.encoded === "string") {
      setEncodedTransaction(response.encoded);
    }
  }, [chainId, transactionMode, sender, recipient, amount]);

  const sign = useCallback(async () => {
    // TODO
  }, []);

  return (
    <div id="app">
      <h1>ADAMIK Test App</h1>
      <div id="tx-plain">
        <label htmlFor="chain-id">Chain ID</label>
        <br />
        <select defaultValue={chainId} disabled name="chain-id" id="chain-id">
          <option value="algorand">Algorand</option>
          <option value="cosmos">Cosmos</option>
        </select>
        <br />
        <br />

        <label htmlFor="tx-mode">Transaction Mode</label>
        <br />
        <select
          defaultValue={transactionMode}
          disabled
          name="tx-mode"
          id="tx-mode"
        >
          <option value="transfer">transfer</option>
          <option value="stake">stake</option>
        </select>
        <br />
        <br />

        <label htmlFor="sender">Sender</label>
        <br />
        <input
          name="sender"
          id="sender"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
        />
        <br />
        <br />

        <label htmlFor="recipient">Recipient</label>
        <br />
        <input
          name="recipient"
          id="recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <br />
        <br />

        <label htmlFor="amount">Amount (in satsoshis)</label>
        <br />
        <input
          name="amount"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <br />
        <br />

        <button type="submit" onClick={encode}>
          ENCODE
        </button>
        <br />
        <br />

        <label style={{ color: "red" }}>{backendError}</label>
      </div>
      <br />
      <br />

      <div id="tx-encoded">
        <label>{encodedTransaction}</label>
        <br />
        <br />

        <button
          disabled={!encodedTransaction.length}
          type="submit"
          onClick={sign}
        >
          SIGN
        </button>
      </div>
    </div>
  );
}
