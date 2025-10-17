type SolscanAccountStake = {
  amount: number;
  role: string;
  status: string;
  type: string;
  voter: string;
  active_stake_amount: number;
  delegated_stake_amount: number;
  sol_balance: number;
  total_reward: string;
  stake_account: string;
  activation_epoch: number;
  stake_type: number;
};

type SolscanAccountStakeResponse = {
  success?: boolean;
  data?: SolscanAccountStake[];
  errors?: {
    code: number;
    message: string;
  }[];
};

export type { SolscanAccountStake, SolscanAccountStakeResponse };
