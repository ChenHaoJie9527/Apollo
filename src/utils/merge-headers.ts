import type { HeadersObject } from "src/types/HeadersObject";

export const mergeHeaders = (
	headerInits: (HeadersInit | HeadersObject | undefined)[],
) => {
	const res: Record<string, string> = {};
	headerInits.forEach((init) => {
		// casting `init` to `HeadersInit` because `Record<string, any>` is
		// properly transformed to `Record<string,string>` by `new Headers(init)`
		new Headers(init as HeadersInit | undefined).forEach((value, key) => {
			value === "null" || value === "undefined"
				? delete res[key]
				: (res[key] = value);
		});
	});
	return res;
};
