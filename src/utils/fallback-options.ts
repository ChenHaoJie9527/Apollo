import type { FallbackOptions } from "../types";
import { isJsonifiable } from "./isJsonifiable";
import { ResponseError } from "./response-error";

/**
 * Default fallback options
 * 1. parseResponse: function to parse responses
 * 2. parseRejected: function to parse rejected responses
 * 3. serializeParams: function to serialize parameters
 * 4. serializeBody: function to serialize request bodies
 * 5. reject: function to reject requests
 * 6. retry: retry options
 */
export const fallbackOptions: FallbackOptions = {
	/**
	 * Function to parse responses
	 * 1. Clone the response
	 * 2. Try to parse as JSON
	 * 3. If failed, try to parse as text
	 * 4. Return the parsed data
	 */
	parseResponse: (response) => {
		const result = response
			.clone()
			.json()
			.catch(() => response.text())
			.then((data) => data || null);
		return result;
	},
	/**
	 * Function to parse rejected responses
	 * 1. Create a ResponseError instance
	 * 2. Return the ResponseError instance
	 */
	parseRejected: async (response, request) => {
		const result = new ResponseError(
			response,
			await parseResponseData(response, request),
			request,
		);
		return result;
	},
	/**
	 * Function to serialize parameters
	 * 1. Convert parameters to URLSearchParams
	 * 2. Return the string representation of URLSearchParams
	 */
	serializeParams: (params) => {
		const stringified = Object.fromEntries(
			Object.entries(params)
				.filter(([_, value]) => value !== undefined)
				.map(([key, value]) => {
					return [
						key,
						typeof value === "string" ? value : JSON.stringify(value),
					];
				}),
		);
		const result = new URLSearchParams(stringified).toString();
		return result;
	},
	/**
	 * Function to serialize request bodies
	 * 1. If the request body is serializable, return the JSON string
	 * 2. Otherwise, return the original request body
	 */
	serializeBody: (body: any) => {
		return isJsonifiable(body) ? JSON.stringify(body) : body;
	},
	/**
	 * Function to reject requests
	 * 1. If the response status code is not 200-299, return true
	 * 2. Otherwise, return false
	 */
	reject: (response) => {
		return !response.ok;
	},
	retry: {
		when: (ctx) => ctx.response?.ok === false,
		attempts: 0,
		delay: 0,
	},
};

/**
 * Function to parse response data
 * 1. Call the parseResponse function
 * 2. Return the parsed data
 */
async function parseResponseData(response: Response, request: Request) {
	return fallbackOptions.parseResponse(response, request);
}
