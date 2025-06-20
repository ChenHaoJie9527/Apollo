import type {
	Apollo,
	DefaultOptions,
	DefaultRawBody,
	FetcherOptions,
	MaybePromise,
	MinFetchFn,
} from "./types";

const emptyOptions = {} as any;

export const apollo = <
	const TFetch extends MinFetchFn,
	const TDefaultOptions extends DefaultOptions<
		TFetch,
		any,
		any
	> = DefaultOptions<TFetch, any, DefaultRawBody>,
>(
	_fetch: TFetch,
	getDefaultOptions: (
		input: Parameters<TFetch>[0],
		fetchOpts: FetcherOptions<TFetch, any, any, any>,
		ctx?: Parameters<TFetch>[2],
	) => MaybePromise<TDefaultOptions> = () => emptyOptions,
): Apollo<TFetch, TDefaultOptions> => {
	return async (input, fetchOpts, ctx) => {
		const defaultOptions = await getDefaultOptions(input, fetchOpts, ctx);
		return defaultOptions;
	};
};
