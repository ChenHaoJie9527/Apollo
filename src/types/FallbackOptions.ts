import type { DefaultRawBody } from "./DefaultRawBody";
import type { MaybePromise } from "./MaybePromise";
import type { ParseRejected } from "./ParseRejected";
import type { ParseResponse } from "./ParseResponse";
import type { RetryOptions } from "./RetryOptions";
import type { SerializeBody } from "./SerializeBody";
import type { SerializeParams } from "./SerializeParams";

/**
 * Define fallback options
 * 1. parseRejected: function to parse rejected responses
 * 2. parseResponse: function to parse responses
 * 3. reject: function to reject requests
 * 4. retry: retry options
 * 5. serializeParams: function to serialize parameters
 * 6. serializeBody: function to serialize request bodies
 */
export type FallbackOptions = {
  parseRejected: ParseRejected; // function to parse rejected responses
  parseResponse: ParseResponse<any>;
  reject: (response: Response) => MaybePromise<boolean>;
  retry: Required<RetryOptions>;
  serializeParams: SerializeParams;
  serializeBody: SerializeBody<DefaultRawBody>;
};
