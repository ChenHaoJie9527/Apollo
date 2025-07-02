import type { StreamingEvent } from "../types/StreamingEvent";

/**
 * 将请求或响应转换为可流式传输的格式
 * @param reqOrRes 请求或响应对象
 * @param onStream 流式传输事件回调函数
 * @returns 可流式传输的请求或响应对象
 */
export const toStreamable = async <T extends Request | Response>(
  reqOrRes: T,
  onStream?: (event: StreamingEvent, reqOrRes: T) => void
) => {
  // 如果没有 body 或者 回调函数，直接返回原对象
  const body = extractBody(reqOrRes);
  if (!body || !onStream) {
    return reqOrRes;
  }

  const isResponse = isResponseObject(reqOrRes);
  const totalBytes = await calculateTotalBytes(reqOrRes, isResponse);

  // 触发初始进度回调
  triggerInitialProgress(onStream, totalBytes, reqOrRes);

  // 创建一个可读流，用于返回给用户
  const monitoredStream = createMonitoredStream(
    body,
    totalBytes,
    onStream,
    reqOrRes
  );

  return wrapWithNewStream(reqOrRes, monitoredStream);
};

/**
 * 提取 body 流，处理兼容问题
 */
function extractBody(reqOrRes: Request | Response) {
  return reqOrRes.body || (reqOrRes as any)._initBody || null;
}

/**
 * 判断是否是 Response 对象
 * @param reqOrRes 请求或响应对象
 * @returns 是否是 Response 对象
 */
function isResponseObject(reqOrRes: Request | Response): reqOrRes is Response {
  return "ok" in reqOrRes;
}

/**
 * 计算总字节数
 * @param reqOrRes 请求或响应对象
 * @param isResponse 是否是 Response 对象
 * @returns 总字节数
 */
async function calculateTotalBytes(
  reqOrRes: Request | Response,
  isResponse: boolean
) {
  const contentLength = reqOrRes.headers.get("content-length");
  let totalBytes = +(contentLength || 0);

  // 如果 request 没有 content-length，预读取 body 流，计算总字节数
  // 只针对 request ，不处理 response，因为request 通常数据量比较小，预读取可接受，而response 可能是 gb文件，预读取可能影响性能
  // 只有在没有获取到 content-length 时，才需要预读取 body 流，计算总字节数
  if (!isResponse && !totalBytes) {
    totalBytes = await preCalculateRequestSize(reqOrRes);
  }

  return totalBytes;
}

/**
 * 预读取 request 的 body 流，计算总字节数
 * @param reqOrRes 请求或响应对象
 * @returns 总字节数
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
 * 触发初始进度回调
 * @param onStream 流式传输事件回调函数
 * @param reqOrRes 请求或响应对象
 * @param totalBytes 总字节数
 */
function triggerInitialProgress<T extends Request | Response>(
  onStream: (event: StreamingEvent, reqOrRes: T) => void,
  totalBytes: number,
  reqOrRes: T
) {
  onStream(
    { totalBytes, transferredBytes: 0, chunk: new Uint8Array() },
    reqOrRes
  );
}

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
        for await (const chunk of originalBody) {
          // 计算已传输的字节数
          transferredBytes += chunk.length;
          // 更新总字节数
          totalBytes = Math.max(totalBytes, transferredBytes);
          // 每读取一个数据块就出发一次进度回调
          onStream({ totalBytes, transferredBytes, chunk }, reqOrRes);
          // 将数据块添加到可读流中
          controller.enqueue(chunk);
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

function wrapWithNewStream<T extends Request | Response>(
  original: T,
  newStream: ReadableStream<Uint8Array>
) {
  if (isResponseObject(original)) {
    return new Response(newStream, original) as T;
  } else {
    return new Request(original, {
      body: newStream,
      duplex: "half", // 设置为半双工，因为request 的body 是不可写的，数据不可逆
    }) as T;
  }
}
