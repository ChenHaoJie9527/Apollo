import type { MaybePromise } from "./MaybePromise";

/**
 * 未知 “不能与类型保护一起使用，而”{}"可以
 * 在尝试访问属性时，“{}”的行为类似于 “未知”（ts 引发错误）
 * 在 ts 中， {}类型代表任何非 null 或 undefined 的值
 * {} 在 类型守卫中使用比 unknown 更安全方便，访问 {} 类型任意属性时，ts 仍然会报错
 */
type Unknown = {};

/**
 * 重试上下文
 * 氛围2中场景
 * 1. 收到服务器响应，但响应时5xx错误，在这种情况下， response 字段会是一个Response对象，error字段可能是undefined
 * 2. 请求未发出或者请求未嫌贵那个，网络中断，DNS解析失败，等等，在这种情况下， response 字段是 undefined，error字段会是一个{}对象
 */
export type RetryContext =
  | {
      response: Response;
      error: undefined;
      request: Request;
    }
  | {
      response: undefined;
      error: Unknown;
      request: Request;
    };

/**
 * 定义重试次数
 * 1. 如果传递的是一个数字，则表示重试次数
 * 2. 如果传递的是一个函数，则表示重试次数的计算函数，函数接收请求对象作为参数，返回一个数字，表示重试次数
 * 3. 如果是重试函数，这就意味着可以根据不同请求，动态设置重试次数，甚至可以是一个异步函数
 */
type RetryAttempts = number | ((request: Request) => MaybePromise<number>);

/**
 * 定义重试前延迟时间
 * 1. 如果传递的是一个数字，则表示重试前延迟时间
 * 2. 如果传递的是一个函数，接受RetryContext和当前尝试次数 attempt 作为参数，返回一个数字，表示重试前延迟时间
 * 3. 示例：
 * 4.   1.指数退避：每次重试后，延迟时间加倍 (delay: ({attempt}) => 1000 * 2 ** attempt)
 * 5.   2.根据错误类型决定延迟：如果是服务器错误 context.response 则延迟5秒;
 * 6.   3.如果是网络错误 context.error 则立即重试
 */
type RetryDelay =
  | number
  | ((context: RetryContext & { attempt: number }) => MaybePromise<number>);

/**
 * 定义是否可以重试函数
 * 1. 通过检查context 来编写逻辑，在特定条件下进行重试
 * 2. 示例：
 * 3.   1.服务器错误(5xx)时重试，而在客户端错误(4xx)时放弃
 * 4.   2.在发生特定类型的网络错误时才重试
 * 5.   3.如果response.body中包含特定错误码，则不重试
 */
type RetryWhen = (context: RetryContext) => boolean;

export type RetryOptions = {
  attempts: RetryAttempts; // 重试次数
  delay: RetryDelay; // 重试前延迟时间
  when: RetryWhen; // 是否可以重试函数: 如果返回 true，则重试，否则不重试
};
