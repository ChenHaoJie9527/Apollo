import {
	createRequest,
	executeRequest,
	executeRetryDelay,
	shouldRetry,
} from "src/helps";
import type { RetryContext } from "src/types/RetryOptions";
import type { DistributiveOmit } from "../types/DistributiveOmit";
import { withTimeout } from "./with-timeout";

/**
 * Helper function: executes a request with retry logic
 * @param input - The input for the request
 * @param finalOptions - The final options for the request
 * @param defaultOptions - The default options for the request
 * @param fetchOpts - The fetch options for the request
 * @param ctx - The context for the request
 * @param _fetch - The fetch function to use
 * @returns The response, error, and the final request object
 */
export const executeWithRetry = async (
	input: any,
	finalOptions: any,
	defaultOptions: any,
	fetchOpts: any,
	ctx: any,
	_fetch: any,
): Promise<{
	response?: Response;
	error?: any;
	request: Request;
}> => {
	// Retry counter: used to determine if the maximum number of retries has been exceeded
	let attempt = 0;
	// Request object reference: stores the Request object, used in retry logic and callback functions
	let request: Request;
	// Tracking retry results: stores retry results, possibly containing response or error
	let outcome = {} as DistributiveOmit<RetryContext, "request">;

	// 获取重试配置，设置默认值
	const retryConfig = finalOptions?.retry || {
		attempts: 0,
		delay: 0,
		when: () => false,
	};

	while (true) {
		// 1. Set timeout
		// per-try timeout
		// Retry counter: used to determine if the maximum number of retries has been exceeded
		finalOptions.signal = withTimeout(
			finalOptions?.signal,
			finalOptions?.timeout,
		);

		// 2. Create request
		request = await createRequest(
			input,
			finalOptions,
			defaultOptions,
			fetchOpts,
		);
		finalOptions?.onRequest?.(request);

		// Execute request
		outcome = await executeRequest(request, finalOptions, ctx, _fetch);

		// Check if retry is needed
		const retryContext = {
			request,
			attempt,
			...outcome,
		};
		if (!(await shouldRetry(retryConfig, ++attempt, retryContext))) {
			break;
		}

		// Execute retry delay
		await executeRetryDelay(retryConfig, retryContext, finalOptions.signal);

		// Trigger retry event
		finalOptions.onRetry?.(retryContext);
	}

	return {
		...outcome,
		request, // return the last used request object
	};
};
