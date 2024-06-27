// FIXME Unused at the moment
// To be considered again when introducing DTOs
// https://adamik.atlassian.net/browse/ADV-13

export interface ValidatorResponse {
  validators: ValidatorDTO[];
}

export interface ValidatorDTO {
  address: string;
  name: string;
  logo?: string;
  website: string;

  status: string;
  commission: number;
  maxCommission?: number;

  raw: unknown;
}
