/**
 * Define the basic Fetch function type
 * @param input request address
 * @param options request options
 * @param ctx request context
 * @returns response Promise
 */
export type MinFetchFn = (
	input: Request,
	options?: any,
	ctx?: any,
) => Promise<Response>;
