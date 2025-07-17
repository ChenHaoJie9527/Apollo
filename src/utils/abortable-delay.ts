/**
 * @param delay - The delay time in milliseconds
 * @param signal - The abort signal
 * @returns A promise that resolves when the delay is complete or rejects if the delay is aborted
 */
export const abortableDelay = (delay: number, signal?: AbortSignal) =>
	new Promise<void>((resolve, reject) => {
		// If the signal is already aborted, reject immediately
		if (signal?.aborted) {
			reject(signal.reason);
			return;
		}

		signal?.addEventListener("abort", handleAbort, { once: true });

		const token = setTimeout(() => {
			signal?.removeEventListener("abort", handleAbort);
			resolve();
		}, delay);

		function handleAbort() {
			clearTimeout(token);
			reject(signal!.reason);
		}
	});
