import type { DefaultRawBody } from "./DefaultRawBody";
import type { MaybePromise } from "./MaybePromise";
import type { ParseRejected } from "./ParseRejected";
import type { ParseResponse } from "./ParseResponse";
import type { RetryOptions } from "./RetryOptions";
import type { SerializeBody } from "./SerializeBody";

export type FallbackOptions = {
  parseRejected: ParseRejected;
  parseResponse: ParseResponse<any>;
  reject: (response: Response) => MaybePromise<boolean>;
  retry: Required<RetryOptions>;
  serializeParams: SerializeParams;
  serializeBody: SerializeBody<DefaultRawBody>;
};
