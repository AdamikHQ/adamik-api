type BabylonMsgCreateBTCDelegation = {
  staker_addr: string;
  pop: {
    btc_sig_type: string;
    btc_sig: string;
  };
  btc_pk: string;
  fp_btc_pk_list: string[];
  staking_time: number;
  staking_value: string;
  staking_tx: string;
  staking_tx_inclusion_proof: null;
  slashing_tx: string;
  delegator_slashing_sig: string;
  unbonding_time: number;
  unbonding_tx: string;
  unbonding_value: string;
  unbonding_slashing_tx: string;
  delegator_unbonding_slashing_sig: string;
};

type BabylonCreateBTCDelegationMessage = {
  "@type": "/babylon.btcstaking.v1.MsgCreateBTCDelegation";
  "/babylon-btcstaking-v1-MsgCreateBTCDelegation": BabylonMsgCreateBTCDelegation;
};

export type { BabylonCreateBTCDelegationMessage, BabylonMsgCreateBTCDelegation };
