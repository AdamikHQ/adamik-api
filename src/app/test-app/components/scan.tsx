import { memo, useState, useCallback, useEffect } from "react";
import { Keyring } from "../keyring/types";
import { KEYRINGS, Chain } from "../shared";

type Props = {
  chain: Chain;
  setSender: (value: any) => void;
  setRecipient: (value: any) => void;
  setError: (value: any) => void;
};

function Scan({ props }: { props: Props }) {
  const { chain, setSender, setRecipient, setError } = props;

  const [loading, setLoading] = useState(false);
  const [keyring, setKeyring] = useState<Keyring | undefined>(undefined);

  useEffect(() => {
    setKeyring(KEYRINGS.get(chain.id));
  }, [chain]);

  const scan = useCallback(async () => {
    setLoading(true);
    setError("");
    setSender("");
    setRecipient("");

    if (!keyring) {
      throw new Error(`No keyring for chain: ${chain.id}`);
    }

    try {
      const { address } = await keyring.getAddress({ chainPrefix: chain.params?.prefix });
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
    setLoading(false);
  }, [chain, keyring, setSender, setRecipient, setError]);

  return (
    <div className="section">
      <label>Default path</label>
      <br />
      <div>{keyring && keyring.getDefaultPath()}</div>
      <br />

      <div className="vertically-centered">
        <button disabled={loading || !chain.id} type="submit" onClick={scan}>
          GET ADDRESS
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

export default memo(Scan);
