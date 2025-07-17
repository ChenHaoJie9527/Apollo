import type { DefaultOptions } from "./DefaultOptions";
import type { FetcherOptions } from "./FetcherOptions";
import type { MergedOptions } from "./MergedOptions";
import type { MinFetchFn } from "./MinFetchFn";
import type { RetryOptions } from "./RetryOptions";

// state machine context interface
export interface RequestContext {
	// Input Parameters - the URL of the request, Request object or other inputs
	input: string | URL | Request;

	// Final options - the complete options after merging
	finalOptions: MergedOptions;

	// Default options - keep the original type for tracking source
	defaultOptions: DefaultOptions<MinFetchFn, any, any>;

	// User-provided fetch options - keep the original type for tracking source
	fetchOpts: FetcherOptions<MinFetchFn, any, any, any>;

	// Context - the third parameter of the fetch function
	ctx: any;

	// fetch function
	_fetch: MinFetchFn;

	// Runtime state
	/** Current retry count, starting from 0 */
	attempt: number;

	/** Maximum retry count */
	maxAttempts: number;

	/** Request object */
	request?: Request;

	/** Response object */
	response?: Response;

	/** Error object - can be any type of error */
	error?: any;

	/** Parsed raw data */
	parsedData?: any;

	/** Data after schema validation */
	validatedData?: any;

	/** Retry configuration */
	retryConfig?: RetryOptions;

	/** Mark to avoid duplicate calls to onRequest */
	onRequestCalled?: boolean;
}
