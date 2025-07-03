import type { StreamingEvent } from "../types/StreamingEvent";

/**
 * Converting a request or response into a streamable format
 * @param reqOrRes request or response object
 * @param onStream Streaming Event Callback Functions
 * @returns Streamable request or response objects
 */
export const toStreamable = async <T extends Request | Response>(
  reqOrRes: T,
  onStream?: (event: StreamingEvent, reqOrRes: T) => void
) => {
  // If there is no body or callback function, the original object is returned.
  const body = extractBody(reqOrRes);
  if (!body || !onStream) {
    return reqOrRes;
  }

  const isResponse = isResponseObject(reqOrRes);

  // For Request, we need to clone it twice: once for precomputation and once for stream monitoring
  let totalBytes: number;
  let streamToMonitor: ReadableStream<Uint8Array>;

  if (!isResponse) {
    // Create two separate clones for Request
    // Clone 1: Used for pre-calculation of size
    const cloneForSizeCalc = reqOrRes.clone();
    // Clone 2: Used for stream monitoring
    const cloneForMonitoring = reqOrRes.clone();

    // Use clone 1 for calculation
    totalBytes = await calculateTotalBytes(cloneForSizeCalc, isResponse);

    // Use clone 2 for stream monitoring
    streamToMonitor = extractBody(cloneForMonitoring)!;
  } else {
    // For Response, use the original object directly
    totalBytes = await calculateTotalBytes(reqOrRes, isResponse);
    streamToMonitor = body;
  }

  // Trigger the initial progress callback
  triggerInitialProgress(onStream, totalBytes, reqOrRes);

  // Create a readable stream for the user to return
  const monitoredStream = createMonitoredStream(
    streamToMonitor,
    totalBytes,
    onStream,
    reqOrRes
  );

  return wrapWithNewStream(reqOrRes, monitoredStream);
};

/**
 * Extract the body stream, handling compatibility issues
 */
function extractBody(reqOrRes: Request | Response) {
  return reqOrRes.body || (reqOrRes as any)._initBody || null;
}

/**
 * Check if the object is a Response object
 * @param reqOrRes request or response object
 * @returns true if the object is a Response object
 */
function isResponseObject(reqOrRes: Request | Response): reqOrRes is Response {
  return "ok" in reqOrRes;
}

/**
 * Calculate the total number of bytes
 * @param reqOrRes request or response object
 * @param isResponse true if the object is a Response object
 * @returns the total number of bytes
 */
async function calculateTotalBytes(
  reqOrRes: Request | Response,
  isResponse: boolean
) {
  const contentLength = reqOrRes.headers.get("content-length");
  let totalBytes = +(contentLength || 0);

  // If the request has no content-length, pre-read the body stream and calculate the total number of bytes
  // Only handle request, not response, because request usually has a small amount of data, and pre-reading is acceptable, while response may be a GB file, and pre-reading may affect performance
  // Only pre-read the body stream and calculate the total number of bytes when content-length is not obtained
  if (!isResponse && !totalBytes) {
    totalBytes = await preCalculateRequestSize(reqOrRes);
  }

  return totalBytes;
}

/**
 * Pre-read the request's body stream and calculate the total number of bytes
 * @param reqOrRes request or response object
 * @returns the total number of bytes
 */
async function preCalculateRequestSize(reqOrRes: Request | Response) {
  let size = 0;
  const cloneBody = reqOrRes.clone().body;

  if (cloneBody) {
    for await (const chunk of cloneBody) {
      size += chunk.length;
    }
  }
  return size;
}

/**
 * Trigger the initial progress callback
 * @param onStream Streaming Event Callback Functions
 * @param totalBytes the total number of bytes
 * @param reqOrRes request or response object
 */
function triggerInitialProgress<T extends Request | Response>(
  onStream: (event: StreamingEvent, reqOrRes: T) => void,
  totalBytes: number,
  reqOrRes: T
) {
  try {
    onStream(
      { totalBytes, transferredBytes: 0, chunk: new Uint8Array() },
      reqOrRes
    );
  } catch (callbackError) {
    // The initial callback error should not interrupt the function execution
    console.warn("Initial progress callback error:", callbackError);
  }
}

/**
 * Create a readable stream for monitoring streaming events
 * @param originalBody the original body stream
 * @param initialTotalBytes the initial total number of bytes
 * @param onStream Streaming Event Callback Functions
 * @param reqOrRes request or response object
 * @returns a readable stream
 */
function createMonitoredStream<T extends Request | Response>(
  originalBody: ReadableStream<Uint8Array>,
  initialTotalBytes: number,
  onStream: (event: StreamingEvent, reqOrRes: T) => void,
  reqOrRes: T
) {
  let transferredBytes = 0;
  let totalBytes = initialTotalBytes;

  return new ReadableStream({
    async start(controller) {
      try {
        const reader = originalBody.getReader();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          if (value) {
            // Calculate the number of transferred bytes
            transferredBytes += value.length;
            // Update the total number of bytes
            totalBytes = Math.max(totalBytes, transferredBytes);

            // Safely trigger the progress callback, capturing errors in the callback
            try {
              onStream(
                { totalBytes, transferredBytes, chunk: value },
                reqOrRes
              );
            } catch (callbackError) {
              // The callback error should not interrupt the normal operation of the stream, just record the error
              console.warn("Progress callback error:", callbackError);
            }

            // Add the data block to the readable stream
            controller.enqueue(value);
          }
        }

        // Close the stream
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Wrap the new streaming stream
 * @param original the original request or response object
 * @param newStream the new streaming stream
 * @returns the wrapped request or response object
 */
function wrapWithNewStream<T extends Request | Response>(
  original: T,
  newStream: ReadableStream<Uint8Array>
) {
  if (isResponseObject(original)) {
    return new Response(newStream, original) as T;
  } else {
    return new Request(original, {
      body: newStream,
      duplex: "half", // Set to half-duplex, because the body of the request is not writable, the data is irreversible
    } as RequestInit) as T;
  }
}
