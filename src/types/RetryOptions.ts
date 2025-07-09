import type { MaybePromise } from "./MaybePromise";

/**
 * Unknown “cannot be used with type guards, but “{}” can.
 * When trying to access properties, “{}” behaves like “unknown” (ts raises an error)
 * In ts, {} type represents any non-null or undefined value
 * {} is safer and more convenient to use in type guards than unknown, ts still raises an error when accessing any property of {} type
 */
type Unknown = {};

/**
 * Retry context
 * There are two scenarios:
 * 1. Received a server response, but the response is a 5xx error, in this case, the response field will be a Response object, and the error field may be undefined
 * 2. The request was not sent or the request was not sent, the network was interrupted, DNS resolution failed, etc., in this case, the response field is undefined, and the error field will be a {} object
 */
export type RetryContext =
  | {
      response: Response;
      error: undefined;
      request: Request;
    }
  | {
      response: undefined;
      error: Unknown;
      request: Request;
    };

/**
 * Define retry attempts
 * 1. If a number is passed, it represents the number of retries
 * 2. If a function is passed, it represents the retry attempts calculation function, which receives the request object as a parameter and returns a number, representing the number of retries
 * 3. If it is a retry function, this means that the number of retries can be dynamically set for different requests, even an asynchronous function
 */
type RetryAttempts = number | ((request: Request) => MaybePromise<number>);

/**
 * Define retry delay
 * 1. If a number is passed, it represents the retry delay
 * 2. If a function is passed, it represents the retry delay calculation function, which receives the RetryContext and the current attempt number attempt as parameters and returns a number, representing the retry delay
 * 3. Examples: 
 * 4.   1.Exponential backoff: The delay time is doubled after each retry (delay: ({attempt}) => 1000 * 2 ** attempt)
 * 5.   2.Determine the delay based on the error type: if the server error context.response, then delay 5 seconds;
 * 6.   3.If the network error context.error, then retry immediately
 */
type RetryDelay =
  | number
  | ((context: RetryContext & { attempt: number }) => MaybePromise<number>);

/**
 * Define whether the retry function can be called
 * 1. Write logic by checking context, and retry under specific conditions
 * 2. Examples:
 * 3.   1.Retry when the server error (5xx), and give up when the client error (4xx)
 * 4.   2.Retry when a specific type of network error occurs
 * 5.   3.If the specific error code is included in response.body, do not retry
 */
type RetryWhen = (context: RetryContext) => boolean;

export type RetryOptions = {
  attempts: RetryAttempts; // Retry attempts
  delay: RetryDelay; // Retry delay
  when: RetryWhen; // Retry when function: if true, retry, otherwise not retry
};
