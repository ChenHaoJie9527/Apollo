export type Method =
	| "GET"
	| "POST"
	| "PUT"
	| "DELETE"
	| "PATCH"
	| "OPTIONS"
	| "HEAD"
	| "CONNECT"
	| "TRACE"
	| (string & {});
