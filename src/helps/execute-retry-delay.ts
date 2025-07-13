import { abortableDelay } from "src/utils";
import { getRetryConfigValue } from "./get-retry-config-value";

/**
 * Helper function: executes the retry delay
 * @param retryConfig - The retry configuration
 * @param context - The context for the request
 * @param signal - The abort signal
 */
export const executeRetryDelay = async (
  retryConfig: any,
  context: any,
  signal?: AbortSignal
): Promise<void> => {
  const delay = await getRetryConfigValue(retryConfig.delay, context);
  await abortableDelay(delay, signal);
};
