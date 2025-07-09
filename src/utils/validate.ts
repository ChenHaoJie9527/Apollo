import type { StandardSchemaV1 } from "@standard-schema/spec";
import { ValidationError } from "../utils";

export const validate = async <T extends StandardSchemaV1>(
  schema: T,
  data: StandardSchemaV1.InferInput<T>
): Promise<StandardSchemaV1.InferOutput<T>> => {
  const result = await schema["~standard"].validate(data);

  if (result.issues) {
    throw new ValidationError(result, data)
  }

  return result.value;
};