import { getRetryConfigValue } from "./get-retry-config-value";

/**
 * Helper function: checks if the request should be retried
 * @param retryConfig - The retry configuration
 * @param attempt - The current attempt number
 * @param context - The context for the request
 * @returns True if the request should be retried, false otherwise
 */
export const shouldRetry = async (
	retryConfig: any,
	attempt: number,
	context: any,
): Promise<boolean> => {
	const shouldRetryByCondition = await retryConfig.when(context);
	if (!shouldRetryByCondition) {
		return false;
	}
	const maxAttempts = await getRetryConfigValue(retryConfig.attempts, context);
	return attempt <= maxAttempts;
};
