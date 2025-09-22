// Explicitly define types that are not defined in the TON API SDK...

type Payload = {
  mode: number;
  message: {
    sum_type: string;
    message_internal: {
      ihr_disabled: boolean;
      bounce: boolean;
      bounced: boolean;
      src: string;
      dest: string;
      value: {
        grams: string;
        other: unknown;
      };
      ihr_fee: string;
      fwd_fee: string;
      created_lt: number;
      created_at: number;
      init: null;
      body: {
        is_right: boolean;
        value: {
          sum_type: string;
          op_code: number;
          value: string;
        };
      };
    };
  };
};

type DecodedBody = {
  signature: string;
  subwallet_id: number;
  valid_until: number;
  seqno: number;
  op: number;
  payload: Payload[];
};

export type { DecodedBody };
