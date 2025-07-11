import type { StandardSchemaV1 } from "@standard-schema/spec";
import { ValidationError } from "./validation-error";

export const validate = async <T extends StandardSchemaV1>(
  schema: T,
  data: StandardSchemaV1.InferInput<T>
): Promise<StandardSchemaV1.InferOutput<T>> => {
  const result = await schema["~standard"].validate(data);

  if (result.issues && result.issues.length > 0) {
    throw new ValidationError(result as StandardSchemaV1.FailureResult, data)
  }

  return (result as StandardSchemaV1.SuccessResult<StandardSchemaV1.InferOutput<T>>).value;
};