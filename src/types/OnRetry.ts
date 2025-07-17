import type { MaybePromise } from "./MaybePromise";
import type { RetryContext } from "./RetryOptions";

export type OnRetry = (
	context: RetryContext & { attempt: number },
) => MaybePromise<void>;
