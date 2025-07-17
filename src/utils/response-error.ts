/**
 * Response error class
 * 1. Inherits from the Error class
 * 2. Contains request, response, status code, data, etc. properties
 * 3. Contains a static method isResponseError to check if the error is of type ResponseError
 */
export class ResponseError<T = any> extends Error {
	readonly request: Request;
	readonly status: number;
	readonly data: T;
	readonly response: Response;
	override name: "ResponseError";

	constructor(response: Response, data: T, request: Request) {
		// Call the parent class constructor, set the error message
		// Since Error accepts an optional message parameter
		// Format the error message, including the status code and status text
		super(`[${response.status}] ${response.statusText}`);
		this.data = data;
		this.name = "ResponseError";
		this.response = response;
		this.request = request;
		this.status = response.status;
	}
}

/**
 * Check if the error is of type ResponseError
 * @param error error object
 * @returns whether the error is of type ResponseError
 */
export const isResponseError = <T = any>(
	error: unknown,
): error is ResponseError<T> => {
	return error instanceof ResponseError;
};
