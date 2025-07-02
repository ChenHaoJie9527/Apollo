import type { StreamingEvent } from "../types/StreamingEvent";

export const toStreamable = async <T extends Request | Response>(
  reqOrRes: T,
  onStream?: (event: StreamingEvent, reqOrRes: T) => void
) => {
  // 判断是Request还是Response
  const isResponse = "ok" in reqOrRes;
  // 读取body流
  // 兼容性处理 _initBody 是 Request 的私有属性，用于存储 body 流
  const body: (Request | Response)["body"] =
    reqOrRes.body || (reqOrRes as any)._initBody;

  if (!body || !onStream) {
    return reqOrRes;
  }
  // 读取content-length
  const contentLength = reqOrRes.headers.get("content-length");
  let totalBytes = +(contentLength || 0);

  // 如果 request 没有 content-length，预读取 body 流，计算总字节数
  // 只针对 request ，不处理 response，因为request 通常数据量比较小，预读取可接受，而response 可能是 gb文件，预读取可能影响性能
  // 只有在没有获取到 content-length 时，才需要预读取 body 流，计算总字节数
  if (!isResponse && !totalBytes) {
    for await (const chunk of reqOrRes.clone().body!) {
      totalBytes += chunk.length;
    }
  }
  let transferredBytes = 0;
  onStream({ totalBytes, transferredBytes, chunk: new Uint8Array() }, reqOrRes);

  // 创建一个可读流，用于返回给用户
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of reqOrRes.body!) {
        // 计算已传输的字节数
        transferredBytes += chunk.length;
        // 更新总字节数
        totalBytes = Math.max(totalBytes, transferredBytes);
        // 每读取一个数据块就出发一次进度回调
        onStream({ totalBytes, transferredBytes, chunk }, reqOrRes);
        // 将数据块添加到可读流中
        controller.enqueue(chunk);
      }
      // 关闭可读流
      controller.close();
    },
  });

  return isResponse
    ? (new Response(stream, reqOrRes) as T)
    : (new Request(reqOrRes, {
        body: stream,
        duplex: "half",
      }) as T);
};
