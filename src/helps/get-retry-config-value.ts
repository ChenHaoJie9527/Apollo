/**
 * Helper function: gets the value of the retry configuration
 * @param value - The value to get
 * @param context - The context for the request
 * @returns The value of the retry configuration
 */
export const getRetryConfigValue = async <T>(
	value: T | ((context: any) => Promise<T> | T),
	context: any,
): Promise<T> => {
	return typeof value === "function"
		? await (value as Function)(context)
		: value;
};
