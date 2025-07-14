import type { DefaultOptions } from "./DefaultOptions";
import type { MinFetchFn } from "./MinFetchFn";

export type GetDefaultParsedData<TDefaultOptions> =
	TDefaultOptions extends DefaultOptions<MinFetchFn, infer U, any> ? U : never;

// Example:
// type MyOptions = DefaultOptions<MinFetchFn, {
//     id: number;
//     name: string;
// }, any>

// type ParseData1 = GetDefaultParsedData<MyOptions>
// const parseData1: ParseData1 = {
//     id: 1,
//     name: "John"
// }
