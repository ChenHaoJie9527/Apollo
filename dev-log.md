# Apollo 开发记录

## 项目简介

Apollo 是一个基于原生Fetch，用于简化和增强前端数据请求的工具库，目标是让数据获取更高效、易用、可扩展。

## 功能规划

### 基础功能

- [ ] 支持 GET/POST/PUT/DELETE 等常用 HTTP 方法
- [ ] 支持请求/响应拦截器
- [ ] 支持全局配置（baseURL、headers 等）
- [ ] 支持请求超时与取消
- [ ] 支持自动重试机制
- [ ] 支持类型推断（TypeScript）
- [ ] 支持错误处理与统一异常捕获
- [ ] 支持请求缓存
- [ ] 支持并发请求控制

### 进阶功能

- [ ] 支持文件上传/下载
- [ ] 支持多环境配置
- [ ] 支持插件机制
- [ ] 支持 SSR 场景

### Task 进行中的功能

- [x] 创建 Apollo 工厂函数
  - [x] 定义函数的第一个参数T类型
    - [x] 定义T类型是MinFetchFn基本fetch函数类型
  - [x] 定义函数第二个参数K类型
    - [x] 定义K类型是DefaultOptions集合类型
    
    - [x] _getDefaultOptions 函数第二个参数 options 支持字段
    
      - [x] ```ts
        export type FetcherOptions<
        	T extends MinFetchFn,
        	TSchema extends StandardSchemaV1,
        	TParsedData,
        	TRawBody,
        > = BaseOptions<T> & {
        	baseUrl?: string;
        	body?: NoInfer<TRawBody> | undefined | null;
        	headers?: HeadersInit | HeadersObject;
        	method?: Method;
        	params?: Record<string, any>;
        	schema?: TSchema;
        	parseResponse?: ParseResponse<TParsedData>;
        	serializeBody?: SerializeBody<TRawBody>;
        } & {};
        ```
    
  - [x] 校验fetch
  - [x] 生成options
  - [ ] 合并选项
  - [ ] 返回增强型Fetch函数

### Test 测试

- [x] 校验apollo是否存在
- [x] 校验能否正常接收 fetch
- [x] 校验是否可以接受defaultOpttions函数

## 开发日志

- 2024-06-14：创建 dev-log.md，梳理初步功能规划。
- 2024-06-14：完成项目初始化，配置 Biome 作为代码风格和格式化工具。

## 未来计划/想法

- 探索与 React/Vue 等主流框架的集成方式
- 支持更丰富的请求适配器（如 Node.js、浏览器、Mock 等）
- 提供详细的文档和示例
