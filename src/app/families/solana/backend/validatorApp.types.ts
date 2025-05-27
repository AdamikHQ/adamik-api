type ValidatorData = {
  network: string;
  account: string;
  name: string;
  keybase_id: string | null;
  www_url: string;
  details: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  admin_warning: string;
  jito: boolean;
  jito_commission: number;
  stake_pools_list: string[];
  is_active: boolean;
  active_stake: number;
  authorized_withdrawer_score: number;
  commission: number;
  data_center_concentration_score: number;
  delinquent: boolean;
  published_information_score: number;
  root_distance_score: number;
  security_report_score: number;
  skipped_slot_score: number;
  skipped_after_score: number;
  software_version: string;
  software_version_score: number;
  stake_concentration_score: number;
  consensus_mods_score: number;
  total_score: number;
  vote_distance_score: number;
  ip: string;
  data_center_key: string;
  autonomous_system_number: number;
  latitude: string;
  longitude: string;
  data_center_host: string;
  vote_account: string;
  epoch_credits: number;
  epoch: number;
  skipped_slots: number;
  skipped_slot_percent: string;
  ping_time: string;
  url: string;
};

type ValidatorList = ValidatorData[];

type DelegatorData = {
  created_at: string;
  activation_epoch: number;
  active_stake: number;
  delegated_stake: number;
  network: string;
  delegated_vote_account_address: string;
  id: number;
  stake_pubkey: string;
  batch_uuid: string;
  stake_pool_id: number;
  staker: string;
  withdrawer: string;
  pool_name: string;
  validator_name: string;
  validator_account: string;
};

type StakeAccountEntry = {
  [delegatorAddress: string]: DelegatorData[];
};

type StakeAccountsResponse = {
  stake_accounts: StakeAccountEntry[];
};

export type { DelegatorData, StakeAccountEntry, StakeAccountsResponse, ValidatorData, ValidatorList };
