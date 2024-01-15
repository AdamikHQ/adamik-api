import { memo, useCallback } from "react";
import { KEYRINGS } from "../shared";

type Props = {
  chainId: string;
  setSender: (value: any) => void;
  setRecipient: (value: any) => void;
  setError: (value: any) => void;
};

function Scan({ props }: { props: Props }) {
  const { chainId, setSender, setRecipient, setError } = props;

  const scan = useCallback(async () => {
    setError("");
    setSender("");
    setRecipient("");

    const keyring = KEYRINGS.get(chainId);
    if (!keyring) {
      throw new Error(`No keyring for chain: ${chainId}`);
    }

    try {
      const { address } = await keyring.getAddress({ chainPrefix: chainId });
      if (address) {
        setSender(address);
        setRecipient(address);
      } else {
        console.error("scan - no address returned");
        setError(`Error! No address returned. Wrong app?`);
      }
    } catch (e) {
      console.error("scan - getAddress error:", e);
      setError(`Error! App returned an error. Wrong app?`);
    }
  }, [chainId, setSender, setRecipient, setError]);

  return (
    <div className="section">
      <button type="submit" onClick={scan}>
        GET ADDRESS
      </button>
    </div>
  );
}

export default memo(Scan);
