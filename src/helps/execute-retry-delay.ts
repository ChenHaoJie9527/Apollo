import { abortableDelay } from "src/utils";
import { getRetryConfigValue } from "./get-retry-config-value";
import type { RetryOptions } from "src/types/RetryOptions";

/**
 * Helper function: executes the retry delay
 * @param retryConfig - The retry configuration
 * @param context - The context for the request
 * @param signal - The abort signal
 */
export const executeRetryDelay = async (
  retryConfig: RetryOptions,
  context: any,
  signal?: AbortSignal
): Promise<void> => {
  const delay = await getRetryConfigValue(retryConfig.delay, context);
  await abortableDelay(delay, signal);
};
