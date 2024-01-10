"use client";
import { useState, useEffect } from "react";

import Data from "./components/data";
import Encode from "./components/encode";
import Sign from "./components/sign";
import Broadcast from "./components/broadcast";

const API: string = process.env.NEXT_PUBLIC_ADAMIK_API || "http://localhost:3000/api";

export default function Page() {
  const [error, setError] = useState("");

  const [chainId, setChainId] = useState("algorand");

  const [balance, setBalance] = useState("");

  const [transactionMode, setTransactionMode] = useState("transfer");
  const [sender, setSender] = useState("RGX5XA7DWZOZ5SLG4WQSNIFKIG4CNX4VOH23YCEX56523DQEAL3QL56XZM");
  const [recipient, setRecipient] = useState("5QS7ANKWSK5XI2ZNWN34BA5KQLSZ3FEI2DTSJQIW5IZZZISD3VEHM5ZT2M");
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

      <Data
        props={{
          chainId,
          sender,
          setSender,
          balance,
          setBalance,
          setError,
        }}
      />

      <Encode
        props={{
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
          setEncodedTransaction,
          setError,
        }}
      />

      <Sign
        props={{
          sender,
          computedAmount,
          fees,
          encodedTransaction,
          setSignature,
          setError,
        }}
      />

      <Broadcast
        props={{
          plainTransaction,
          encodedTransaction,
          signature,
          setTransactionHash,
          setError,
        }}
      />

      <div className="section">
        <label>Transaction hash</label>
        <br />
        <div className="text">{transactionHash}</div>
      </div>
    </div>
  );
}
