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
