import type {
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
	fetch: TFetch,
	getDefaultOptions: (
		input: Parameters<TFetch>[0],
		fetchOpts: FetcherOptions<TFetch, any, any, any>,
		ctx?: Parameters<TFetch>[2],
	) => MaybePromise<TDefaultOptions> = () => emptyOptions,
) => {

	return async (input, fetchOpts, ctx) => {

	}
};
