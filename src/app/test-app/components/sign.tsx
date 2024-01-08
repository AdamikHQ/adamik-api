import { memo, useCallback } from "react";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import NanoApp from "@ledgerhq/hw-app-algorand";

type Props = {
  sender: string;
  computedAmount: string;
  fees: string;
  encodedTransaction: string;
  setSignature: (value: any) => void;
  setError: (value: any) => void;
};

function Sign({ props }: { props: Props }) {
  const {
    sender,
    computedAmount,
    fees,
    encodedTransaction,
    setSignature,
    setError,
  } = props;

  const sign = useCallback(async () => {
    /*
        setError("");
        setSignature("");
        setTransactionHash("");
        */

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
      setError(`Error! ${e}`);
      return;
    }
  }, [sender, encodedTransaction, setSignature, setError]);

  return (
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
  );
}

export default memo(Sign);
