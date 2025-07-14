import { createRequest, executeRequest, executeRetryDelay } from "../helps";
import { validate } from "./validate";
import { withTimeout } from "./with-timeout";
import type { RequestContext } from "../types";

// State enumeration
export enum RequestState {
  // Initialization state
  INITIALIZING = "INITIALIZING",
  // Preparing request state
  PREPARING_REQUEST = "PREPARING_REQUEST",
  // Sending request state
  SENDING_REQUEST = "SENDING_REQUEST",
  // Response received state
  RESPONSE_RECEIVED = "RESPONSE_RECEIVED",
  // Checking response state
  CHECKING_RESPONSE = "CHECKING_RESPONSE",
  // Parsing response state
  PARSING_RESPONSE = "PARSING_RESPONSE",
  // Validating schema state
  VALIDATING_SCHEMA = "VALIDATING_SCHEMA",
  // Evaluating retry state
  EVALUATING_RETRY = "EVALUATING_RETRY",
  // Delaying retry state
  DELAYING_RETRY = "DELAYING_RETRY",
  // Success state
  REQUEST_SUCCESS = "REQUEST_SUCCESS",
  // Failure state
  REQUEST_FAILED = "REQUEST_FAILED",
  // Parse error state
  PARSE_ERROR = "PARSE_ERROR",
  // Validation error state
  VALIDATION_ERROR = "VALIDATION_ERROR",
  // Network error state
  NETWORK_ERROR = "NETWORK_ERROR",
  // Response rejected state
  RESPONSE_REJECTED = "RESPONSE_REJECTED",
}

// State handler interface
export interface StateHandler {
  handle(context: RequestContext): Promise<RequestState>;
}

// Initializing state
export class InitializingState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    context.attempt = 0;
    context.retryConfig = context.finalOptions?.retry || {
      attempts: 0,
      delay: 0,
      when: () => false,
    };
    // Do not calculate maxAttempts during initialization, because the request has not been created
    // maxAttempts will be calculated in EvaluatingRetryState
    context.maxAttempts = 0;

    return RequestState.PREPARING_REQUEST;
  }
}

// Preparing request state
export class PreparingRequestState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    try {
      // Set timeout
      context.finalOptions.signal = withTimeout(
        context.finalOptions?.signal,
        context.finalOptions?.timeout
      );

      // Create request
      context.request = await createRequest(
        context.input,
        context.finalOptions,
        context.defaultOptions,
        context.fetchOpts
      );

      // Trigger onRequest event only on the first request
      if (!context.onRequestCalled) {
        context.finalOptions?.onRequest?.(context.request);
        context.onRequestCalled = true;
      }

      return RequestState.SENDING_REQUEST;
    } catch (error) {
      context.error = error;
      return RequestState.NETWORK_ERROR;
    }
  }
}

// Sending request state
export class SendingRequestState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    try {
      const outcome = await executeRequest(
        context.request!,
        context.finalOptions,
        context.ctx,
        context._fetch
      );

      if (outcome.error) {
        context.error = outcome.error;
        return RequestState.NETWORK_ERROR;
      }

      context.response = outcome.response;
      return RequestState.RESPONSE_RECEIVED;
    } catch (error) {
      context.error = error;
      return RequestState.NETWORK_ERROR;
    }
  }
}

// Response received state
export class ResponseReceivedState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    return RequestState.CHECKING_RESPONSE;
  }
}

// Checking response state
export class CheckingResponseState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    try {
      if (!context.response) {
        context.error = new Error("Response is not available");
        return RequestState.NETWORK_ERROR;
      }

      const isRejected = await (context.finalOptions.reject || (() => false))(
        context.response
      );

      // Rejected response
      if (isRejected) {
        return RequestState.RESPONSE_REJECTED;
      }

      // Parsing response
      return RequestState.PARSING_RESPONSE;
    } catch (error) {
      context.error = error;
      return RequestState.NETWORK_ERROR;
    }
  }
}

// Parsing response state
export class ParsingResponseState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    try {
      // Check if the user provided a custom parseResponse function
      // If parseResponse is provided in fetchOpts, use the user-provided function, otherwise use the default JSON parsing
      const userParseResponse = context.fetchOpts?.parseResponse;

      if (userParseResponse) {
        context.parsedData = await userParseResponse(
          context.response!,
          context.request!
        );
      } else {
        const responseText = await context.response!.text();
        context.parsedData = JSON.parse(responseText);
      }

      return RequestState.VALIDATING_SCHEMA;
    } catch (error) {
      context.error = error;
      return RequestState.PARSE_ERROR;
    }
  }
}

// Validating schema state
export class ValidatingSchemaState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    try {
      context.validatedData = context.finalOptions.schema
        ? await validate(context.finalOptions.schema, context.parsedData)
        : context.parsedData;

      return RequestState.REQUEST_SUCCESS;
    } catch (error) {
      context.error = error;
      return RequestState.VALIDATION_ERROR;
    }
  }
}

// Evaluating Retry Status
export class EvaluatingRetryState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    try {
      const retryContext = {
        request: context.request!,
        attempt: context.attempt,
        response: context.response,
        error: context.error,
      };

      // Check if should retry
      const shouldRetryByCondition = await context.retryConfig?.when(
        retryContext
      );
      if (!shouldRetryByCondition) {
        return RequestState.REQUEST_FAILED;
      }

      // Get the maximum number of retries
      const maxAttempts =
        typeof context.retryConfig?.attempts === "function"
          ? await context.retryConfig?.attempts(context.request!)
          : context.retryConfig?.attempts;

      // Check if the maximum number of retries has been reached
      // attempts start at 0, maxAttempts is the number of retries
      // e.g. maxAttempts = 2 means up to 2 retries
      // initial request (attempt=0) + 2 retries (attempt=1,2) = 3 total requests
      if (!maxAttempts || context.attempt >= maxAttempts) {
        return RequestState.REQUEST_FAILED;
      }

      return RequestState.DELAYING_RETRY;
    } catch (error) {
      context.error = error;
      return RequestState.REQUEST_FAILED;
    }
  }
}

// Delaying retry state, retry interval time
export class DelayingRetryState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    try {
      // Increase retry count
      context.attempt++;

      const retryContext = {
        request: context.request!,
        attempt: context.attempt,
        response: context.response,
        error: context.error,
      };

      // Abortable delay
      await executeRetryDelay(
        context.retryConfig!,
        retryContext,
        context.finalOptions.signal
      );

      // trigger a retry event
      context.finalOptions.onRetry?.(retryContext);

      return RequestState.PREPARING_REQUEST;
    } catch (error) {
      context.error = error;
      return RequestState.REQUEST_FAILED;
    }
  }
}

// success state
export class RequestSuccessState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    if (context.request) {
      context.finalOptions.onSuccess?.(context.validatedData, context.request);
    }
    return RequestState.REQUEST_SUCCESS;
  }
}

// Failure state
export class RequestFailedState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    if (context.request) {
      context.finalOptions.onError?.(context.error, context.request);
    }
    //
    throw context.error;
  }
}

// Parse error state
export class ParseErrorState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    if (context.request) {
      context.finalOptions.onError?.(context.error, context.request);
    }
    throw context.error;
  }
}

// Validation error state
export class ValidationErrorState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    if (context.request) {
      context.finalOptions.onError?.(context.error, context.request);
    }
    throw context.error;
  }
}

// Network error state
export class NetworkErrorState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    return RequestState.EVALUATING_RETRY;
  }
}

// 响应被拒绝状态
export class ResponseRejectedState implements StateHandler {
  async handle(context: RequestContext): Promise<RequestState> {
    try {
      if (!context.response) {
        context.error = new Error("Response is not available");
        return RequestState.REQUEST_FAILED;
      }

      context.error =
        context.finalOptions.parseRejected && context.request
          ? await context.finalOptions.parseRejected(
              context.response,
              context.request
            )
          : new Error(
              `HTTP ${context.response.status}: ${context.response.statusText}`
            );

      return RequestState.EVALUATING_RETRY;
    } catch (error) {
      context.error = error;
      return RequestState.REQUEST_FAILED;
    }
  }
}

// state machine class
export class RequestStateMachine {
  private handlers: Map<RequestState, StateHandler> = new Map();
  private currentState: RequestState = RequestState.INITIALIZING;
  private context: RequestContext;

  constructor(context: RequestContext) {
    this.context = context;
    this.initializeHandlers();
  }

  /**
   * @description Initialize the handlers: Create corresponding processor instances for each state
   */
  private initializeHandlers(): void {
    this.handlers.set(RequestState.INITIALIZING, new InitializingState());
    this.handlers.set(
      RequestState.PREPARING_REQUEST,
      new PreparingRequestState()
    );
    this.handlers.set(RequestState.SENDING_REQUEST, new SendingRequestState());
    this.handlers.set(
      RequestState.RESPONSE_RECEIVED,
      new ResponseReceivedState()
    );
    this.handlers.set(
      RequestState.CHECKING_RESPONSE,
      new CheckingResponseState()
    );
    this.handlers.set(
      RequestState.PARSING_RESPONSE,
      new ParsingResponseState()
    );
    this.handlers.set(
      RequestState.VALIDATING_SCHEMA,
      new ValidatingSchemaState()
    );
    this.handlers.set(
      RequestState.EVALUATING_RETRY,
      new EvaluatingRetryState()
    );
    this.handlers.set(RequestState.DELAYING_RETRY, new DelayingRetryState());
    this.handlers.set(RequestState.REQUEST_SUCCESS, new RequestSuccessState());
    this.handlers.set(RequestState.REQUEST_FAILED, new RequestFailedState());
    this.handlers.set(RequestState.PARSE_ERROR, new ParseErrorState());
    this.handlers.set(
      RequestState.VALIDATION_ERROR,
      new ValidationErrorState()
    );
    this.handlers.set(RequestState.NETWORK_ERROR, new NetworkErrorState());
    this.handlers.set(
      RequestState.RESPONSE_REJECTED,
      new ResponseRejectedState()
    );
  }

  /**
   * @description Execute the state machine
   * @returns result or throw error
   */
  async execute(): Promise<any> {
    // Define terminal states: 1. Request success, 2. Request failed, 3. Parse error, 4. Validation error
    const terminalStates = new Set([
      RequestState.REQUEST_SUCCESS,
      RequestState.REQUEST_FAILED,
      RequestState.PARSE_ERROR,
      RequestState.VALIDATION_ERROR,
    ]);

    // Main state loop, if it is not a terminal state, get the state handler and update the current state
    while (!terminalStates.has(this.currentState)) {
      const handler = this.handlers.get(this.currentState);
      if (!handler) {
        throw new Error(`No handler found for state: ${this.currentState}`);
      }

      const nextState = await handler.handle(this.context);
      this.currentState = nextState;
    }

    // Handling of terminal status
    const terminalHandler = this.handlers.get(this.currentState);
    if (terminalHandler) {
      await terminalHandler.handle(this.context);
    }

    // Return result or throw error
    if (this.currentState === RequestState.REQUEST_SUCCESS) {
      return this.context.validatedData;
    } else {
      // For error status, throw error directly
      throw this.context.error;
    }
  }

  /**
   * @description Get the current state
   * @returns current state
   */
  getCurrentState(): RequestState {
    return this.currentState;
  }

  /**
   * @description Get the context
   * @returns context
   */
  getContext(): RequestContext {
    return this.context;
  }
}
