"use client";
import { useState, useEffect } from "react";

import { Chain, amountToSmallestUnit } from "./shared";
import Scan from "./components/scan";
import Data from "./components/data";
import Encode from "./components/encode";
import Sign from "./components/sign";
import Broadcast from "./components/broadcast";

const API: string = process.env.NEXT_PUBLIC_ADAMIK_API || "http://localhost:3000/api";

export default function Page() {
  const [error, setError] = useState("");

  const [supportedChainsIds, setSupportedChainsIds] = useState<Set<string>>(new Set([]));
  const [supportedChainsDetails, setSupportedChainsDetails] = useState<Record<string, Chain>>({});
  const [selectedChain, setSelectedChain] = useState<Chain>({
    id: "",
    name: "",
    family: "",
    ticker: "",
    magnitude: 0,
  });

  const [balance, setBalance] = useState("");

  const [transactionMode, setTransactionMode] = useState("transfer");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
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
    const fetchSupportedChainsIds = async () => {
      setSupportedChainsIds(new Set());

      const response = await fetch(`${API}/chains`, {
        method: "GET",
      });

      if (response.status === 200) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setSupportedChainsIds(new Set(data));
        }
      } else {
        console.error("supported chains - backend error:", response.statusText);
        setError(`Error! ${response.statusText}`);
      }
    };

    fetchSupportedChainsIds();
  }, []);

  // Retreive details of each supported chain ID from server
  useEffect(() => {
    const fetchSupportedChainsDetails = async () => {
      setSupportedChainsDetails({});
      const chains: Record<string, Chain> = {};
      await Promise.all(
        Array.from(supportedChainsIds).map(async (chainId) => {
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

      setSupportedChainsDetails(chains);
      setSelectedChain(Object.values(chains)[0]);
    };

    if (supportedChainsIds.size) {
      fetchSupportedChainsDetails();
    }
  }, [supportedChainsIds]);

  useEffect(() => {
    const transaction: any = {
      chainId: selectedChain.id,
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
      transaction.amount = amountToSmallestUnit(amount, selectedChain.magnitude);
    }
    if (fees.length) {
      transaction.fees = fees;
    }
    if (gas) {
      transaction.gas = gas;
    }

    setPlainTransaction(transaction);
  }, [selectedChain, transactionMode, sender, recipient, amount, fees, gas, useMaxAmount]);

  useEffect(() => {
    setBalance("");
    setSender("");
    setRecipient("");
    setAmount("");
    setFees("");
    setGas("");
    setComputedAmount("");
    setEncodedTransaction("");
    setSignature("");
    setTransactionHash("");
  }, [selectedChain]);

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
      <select
        defaultValue={selectedChain.id}
        id="chain-id"
        onChange={(e) => {
          setSelectedChain(supportedChainsDetails[e.target.value]);
        }}
      >
        {Object.entries(supportedChainsDetails).map(([, chain]) => {
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
          chain: selectedChain,
          setSender,
          setRecipient,
          setError,
        }}
      />
      <Data
        props={{
          chain: selectedChain,
          sender,
          setSender,
          balance,
          setBalance,
          setError,
        }}
      />
      <Encode
        props={{
          chain: selectedChain,
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
          chain: selectedChain,
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
