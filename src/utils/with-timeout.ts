/**
 * Combining signals and timeout signals
 * @description This is a utility function to merge signals and timeout signals, returning AbortSignal.any if the incoming signal is AbortSignal, otherwise returning the incoming signal
 * @param userSignal User-supplied manual abort signal
 * @param timeoutMs Timeout time, if the value passed in is less than or equal to 0, the timeout signal is not set
 * @returns Merged signal
 */
export const withTimeout = (userSignal?: AbortSignal, timeoutMs?: number) => {
  // Check for browser compatibility - if it is not supported, simply return the original signal
  if (!isAbortSignalCompositionSupported()) {
    return userSignal;
  }

  const signalsToCompose = buildSignalArray(userSignal, timeoutMs);

  return signalsToCompose.length > 0
    ? AbortSignal.any(signalsToCompose)
    : undefined;
};

/**
 * Check if the browser supports signal composition
 * @returns Whether signal composition is supported
 */
function isAbortSignalCompositionSupported() {
  return "any" in AbortSignal && "timeout" in AbortSignal;
}

/**
 * Constructing Signal Arrays
 * @param userSignal User-supplied manual abort signal
 * @param timeoutMs Timeout time, if the value passed in is less than or equal to 0, the timeout signal is not set
 * @returns Constructed signal array
 */
function buildSignalArray(userSignal?: AbortSignal, timeoutMs?: number) {
  const signals: AbortSignal[] = [];

  if (userSignal) {
    signals.push(userSignal);
  }

  if (timeoutMs && timeoutMs > 0) {
    signals.push(AbortSignal.timeout(timeoutMs));
  }

  return signals;
}
