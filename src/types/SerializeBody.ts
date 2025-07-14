/**
 * SerializeBody is a tool type used to serialize the request body
 * T: request body type
 */
export type SerializeBody<T> = (body: T) => BodyInit | null | undefined;
