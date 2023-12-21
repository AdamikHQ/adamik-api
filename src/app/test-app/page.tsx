"use client";
import { useState, useEffect, useCallback } from "react";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import NanoApp from "@ledgerhq/hw-app-algorand";

const API: string =
  process.env.NEXT_PUBLIC_ADAMIK_API || "http://localhost:3000/api";

export default function Page() {
  const [error, setError] = useState("");

  const [chainId, setChainId] = useState("algorand");
  const [transactionMode, setTransactionMode] = useState("transfer");
  const [sender, setSender] = useState(
    "RGX5XA7DWZOZ5SLG4WQSNIFKIG4CNX4VOH23YCEX56523DQEAL3QL56XZM"
  );
  const [recipient, setRecipient] = useState(
    "5QS7ANKWSK5XI2ZNWN34BA5KQLSZ3FEI2DTSJQIW5IZZZISD3VEHM5ZT2M"
  );
  const [amount, setAmount] = useState("1000");
  const [fees, setFees] = useState("");

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
    });
  }, [chainId, transactionMode, sender, recipient, amount]);

  const encode = useCallback(async () => {
    setError("");
    setEncodedTransaction("");
    setSignature("");
    setTransactionHash("");

    fetch(`${API}/transaction/encode`, {
      method: "POST",
      body: JSON.stringify({ transaction: plainTransaction }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (typeof data?.encoded === "string") {
          setEncodedTransaction(data.encoded);
        }
        if (typeof data?.plain?.fees === "string") {
          setFees(data.plain.fees);
        }
      })
      .catch((e) => {
        console.error("encode - backend error:", e);
        setError(`Error! ${e}`);
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
    })
      .then(async (response) => await response.json())
      .catch((e) => {
        console.error("broadcast - backend error:", e);
        setError(`Error! ${e}`);
      });

    if (response.error) {
      setError(`Error! ${response.error}`);
    } else if (typeof response?.hash === "string") {
      setTransactionHash(response.hash);
    }
  }, [plainTransaction, encodedTransaction, signature]);

  return (
    <div id="app">
      <h1>ADAMIK Test App</h1>

      <label style={{ color: "red" }}>{error}</label>
      <br />

      <label htmlFor="chain-id">Chain ID</label>
      <br />
      <select defaultValue={chainId} disabled name="chain-id" id="chain-id">
        <option value="algorand">Algorand</option>
        <option value="cosmos">Cosmos</option>
      </select>
      <br />
      <br />

      <div id="tx-plain" style={styles.div}>
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
      </div>

      <br />
      <br />

      <div id="tx-encoded" style={styles.div}>
        <label htmlFor="amount">Fees (in satsoshis)</label>
        <br />
        <label>{fees}</label>
        <br />
        <br />

        <label>Encoded transaction</label>
        <br />
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

      <br />
      <br />

      <div id="tx-signed" style={styles.div}>
        <label>Signature</label>
        <br />
        <label>{signature}</label>
        <br />
        <br />

        <button disabled={!signature.length} type="submit" onClick={broadcast}>
          BROADCAST
        </button>
      </div>

      <br />
      <br />
      <div id="tx-hash" style={styles.div}>
        <label>Transaction hash</label>
        <br />
        <label>{transactionHash}</label>
      </div>
    </div>
  );
}

const styles = {
  div: {
    borderStyle: "solid",
    borderRadius: "12px",
    padding: "5px",
  },
};
