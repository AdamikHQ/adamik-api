"use client";
import { useState, useEffect, useCallback } from "react";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import NanoApp from "@ledgerhq/hw-app-algorand";

const API: string =
  process.env.NEXT_PUBLIC_ADAMIK_API || "http://localhost:3000/api";

export default function Page() {
  const [error, setError] = useState("");

  const [chainId, setChainId] = useState("algorand");

  const [balance, setBalance] = useState("");

  const [transactionMode, setTransactionMode] = useState("transfer");
  const [sender, setSender] = useState(
    "RGX5XA7DWZOZ5SLG4WQSNIFKIG4CNX4VOH23YCEX56523DQEAL3QL56XZM"
  );
  const [recipient, setRecipient] = useState(
    "5QS7ANKWSK5XI2ZNWN34BA5KQLSZ3FEI2DTSJQIW5IZZZISD3VEHM5ZT2M"
  );
  const [amount, setAmount] = useState("1000");
  const [useMaxAmount, setUseMaxAmount] = useState(false);

  const [fees, setFees] = useState("");
  const [computedAmount, setComputedAmount] = useState("");

  const [plainTransaction, setPlainTransaction] = useState({});
  const [encodedTransaction, setEncodedTransaction] = useState("");
  const [signature, setSignature] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  useEffect(() => {
    setPlainTransaction({
      chain: chainId,
      mode: transactionMode,
      senders: [sender],
      recipients: [recipient],
      amount,
      useMaxAmount,
    });
  }, [chainId, transactionMode, sender, recipient, amount, useMaxAmount]);

  const getData = useCallback(async () => {
    setError("");

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

  const encode = useCallback(async () => {
    setError("");
    setEncodedTransaction("");
    setSignature("");
    setTransactionHash("");

    fetch(`${API}/transaction/encode`, {
      method: "POST",
      body: JSON.stringify({ transaction: plainTransaction }),
    }).then(async (response) => {
      if (response.status === 200) {
        const data = await response.json();
        if (typeof data?.encoded === "string") {
          setEncodedTransaction(data.encoded);
        }
        if (typeof data?.plain?.fees === "string") {
          setFees(data.plain.fees);
        }
        if (typeof data?.plain?.amount === "string") {
          setComputedAmount(data.plain.amount);
        }
      } else {
        console.error("encode - backend error:", response.statusText);
        setError(`Error! ${response.statusText}`);
      }
    });
  }, [plainTransaction]);

  const sign = useCallback(async () => {
    setError("");
    setSignature("");
    setTransactionHash("");

    try {
      const transport = await TransportWebUSB.create();
      const ledgerNanoApp = new NanoApp(transport);

      const { signature: signatureBuffer } = await ledgerNanoApp.sign(
        sender,
        encodedTransaction
      );
      signatureBuffer && setSignature(signatureBuffer.toString("hex"));
    } catch (e) {
      console.error("sign - signature error:", e);
      return;
    }
  }, [sender, encodedTransaction]);

  const broadcast = useCallback(async () => {
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

    if (response.error) {
      console.error("broadcast - backend error:", response.error);
      setError(`Error! ${response.error}`);
    } else if (typeof response?.hash === "string") {
      setTransactionHash(response.hash);
    }
  }, [plainTransaction, encodedTransaction, signature]);

  return (
    <div>
      <h1 className="title">ADAMIK Test App</h1>

      {error && (
        <div>
          <label className="error">{error}</label>
          <br />
        </div>
      )}

      <label>Chain ID</label>
      <br />
      <select defaultValue={chainId} disabled id="chain-id">
        <option value="algorand">Algorand</option>
        <option value="cosmos">Cosmos</option>
      </select>
      <br />
      <br />

      <div className="section">
        <label>Address</label>
        <br />
        <input
          id="address"
          className="input-text"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
        />
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
        <input
          id="recipient"
          className="input-text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
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
        <input
          type="checkbox"
          onChange={(e) => setUseMaxAmount(e.target.checked)}
        />
        <label>Max</label>
        <br />
        <br />

        <button type="submit" onClick={encode}>
          ENCODE
        </button>
      </div>

      <div className="section">
        <label>Amount (in satoshis)</label>
        <br />
        <div>{computedAmount}</div>
        <br />
        <br />

        <label>Fees (in satoshis)</label>
        <br />
        <div>{fees}</div>
        <br />
        <br />

        <label>Encoded transaction</label>
        <br />
        <div className="text">{encodedTransaction}</div>
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

      <div className="section">
        <label>Signature</label>
        <br />
        <div className="text">{signature}</div>
        <br />
        <br />

        <button disabled={!signature.length} type="submit" onClick={broadcast}>
          BROADCAST
        </button>
      </div>

      <div className="section">
        <label>Transaction hash</label>
        <br />
        <div className="text">{transactionHash}</div>
      </div>
    </div>
  );
}
