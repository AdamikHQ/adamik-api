"use client";
import { useState, useEffect } from "react";

import Scan from "./components/scan";
import Data from "./components/data";
import Encode from "./components/encode";
import Sign from "./components/sign";
import Broadcast from "./components/broadcast";

const API: string = process.env.NEXT_PUBLIC_ADAMIK_API || "http://localhost:3000/api";

// Must match server type
type Chain = {
  id: string;
  name: string;
  family: string;
  ticker: string;
  magnitude: number;
};

export default function Page() {
  const [error, setError] = useState("");

  const [supportedChainIds, setSupportedChainIds] = useState<Set<string>>(new Set([]));
  const [supportedChainDetails, setSupportedChainDetails] = useState<Record<string, Chain>>({});
  const [chainId, setChainId] = useState<string>("");

  const [balance, setBalance] = useState("");

  const [transactionMode, setTransactionMode] = useState("transfer");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("1000");
  const [useMaxAmount, setUseMaxAmount] = useState(false);

  const [fees, setFees] = useState("");
  const [gas, setGas] = useState("");
  const [computedAmount, setComputedAmount] = useState("");

  const [plainTransaction, setPlainTransaction] = useState({});
  const [encodedTransaction, setEncodedTransaction] = useState("");
  const [signature, setSignature] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  // Retrieve all supported chain IDs from server
  useEffect(() => {
    const fetchSupportedChainIds = async () => {
      const response = await fetch(`${API}/chains`, {
        method: "GET",
      });

      if (response.status === 200) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setSupportedChainIds(new Set(data));
          if (data.length) {
            setChainId(data[0]);
          }
        }
      } else {
        console.error("supported chains - backend error:", response.statusText);
        setError(`Error! ${response.statusText}`);
      }
    };

    fetchSupportedChainIds();
  }, [setSupportedChainIds, setChainId, setError]);

  // Retreive details of each supported chain ID from server
  useEffect(() => {
    const fetchSupportedChainDetails = async () => {
      setSupportedChainDetails({});
      const chains: Record<string, Chain> = {};
      await Promise.all(
        Array.from(supportedChainIds).map(async (chainId) => {
          const response = await fetch(`${API}/chains/${chainId}`, {
            method: "GET",
          });

          if (response.status === 200) {
            const data = await response.json();
            chains[data.id] = data;
          } else {
            console.error("chain details - backend error:", response.statusText);
            setError(`Error! ${response.statusText}`);
          }
        })
      );

      setSupportedChainDetails(chains);
    };

    fetchSupportedChainDetails();
  }, [supportedChainIds, setSupportedChainDetails, setError]);

  useEffect(() => {
    const transaction: any = {
      chainId,
      mode: transactionMode,
      useMaxAmount,
    };

    if (sender.length) {
      transaction.senders = [sender];
    }
    if (recipient.length) {
      transaction.recipients = [recipient];
    }
    if (amount.length) {
      transaction.amount = amount;
    }
    if (fees.length) {
      transaction.fees = fees;
    }
    if (gas) {
      transaction.gas = gas;
    }

    setPlainTransaction(transaction);
  }, [chainId, transactionMode, sender, recipient, amount, fees, gas, useMaxAmount]);

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
      <select defaultValue={chainId} id="chain-id" onChange={(e) => setChainId(e.target.value)}>
        {Object.entries(supportedChainDetails).map(([, chain]) => {
          return (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          );
        })}
      </select>
      <br />
      <br />
      <Scan
        props={{
          chainId,
          setSender,
          setRecipient,
          setError,
        }}
      />
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
          setGas,
          setEncodedTransaction,
          setError,
        }}
      />
      <Sign
        props={{
          chainId,
          sender,
          computedAmount,
          fees,
          gas,
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
