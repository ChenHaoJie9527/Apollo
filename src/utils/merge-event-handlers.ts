export function mergeEventHandlers<
	T extends Record<string, any>,
	U extends Record<string, any>,
>(defaultOptions: T, fetchOpts: U) {
	const mergeOptions: Record<string, any> = { ...defaultOptions };
	Object.keys(defaultOptions).forEach((key) => {
		if (/^on[A-Z]/.test(key)) {
			const originalHandler = defaultOptions[key];
			const fetchHandler = fetchOpts[key];
			if (
				typeof originalHandler === "function" &&
				typeof fetchHandler === "function"
			) {
				(mergeOptions as any)[key] = (...args: any[]) => {
					originalHandler(...args);
					fetchHandler(...args);
				};
			} else if (
				typeof fetchHandler === "function" &&
				typeof originalHandler !== "function"
			) {
				(mergeOptions as any)[key] = fetchHandler;
			}
		}
	});

	Object.keys(fetchOpts).forEach((key) => {
		if (/^on[A-Z]/.test(key)) {
			const fetchHandler = fetchOpts[key];
			if (typeof fetchHandler === "function" && !defaultOptions[key]) {
				(mergeOptions as any)[key] = fetchHandler;
			}
		}
	});

	return mergeOptions;
}
