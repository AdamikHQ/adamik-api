export interface ValidatorResponse<T> {
  validators: ValidatorDTO<T>[];
}

export interface ValidatorDTO<T> {
  address: string;
  name: string;
  logo?: string;
  website: string;

  status: string;
  commission: number;
  maxCommission?: number;

  raw: T;
}
