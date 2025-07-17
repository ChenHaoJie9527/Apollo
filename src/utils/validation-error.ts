import type { StandardSchemaV1 } from "@standard-schema/spec";

export class ValidationError<T = any> extends Error {
	override name: "ValidationError";
	issues: readonly StandardSchemaV1.Issue[];
	value: T;

	constructor(result: StandardSchemaV1.FailureResult, data: T) {
		super(JSON.stringify(result.issues));
		this.name = "ValidationError";
		this.issues = result.issues;
		this.value = data;
	}
}
