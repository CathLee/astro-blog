---
title: 【AI基建】PI-Agent里面的核心库的区别
pubDate: 2025-08-23
categories: ['AI基建']
description: '解析 pi-agent-core、pi-coding-agent、pi-ai 三个核心库的职责区别'
---

### `pi-agent-core`

通用的 agent 运行时逻辑,不含 UI 或 CLI 交互,主要包括 `Agent`、`agentLoop`、`AgentState`、`AgentHarness`、`SessionRepository` 等核心实体

### `pi-coding-agent`(CLI 应用)

**pi-ai = 大脑接口（LLM 能力）**
 **pi-agent-core = Agent 引擎（循环、状态、消息、工具编排）**
 **pi-coding-agent = 一个具体产品形态（像 Claude Code / Cursor CLI）**

```shell
                         User
                          |
                          |
                    pi-coding-agent
                    (CLI/TUI 产品层)
                          |
        +-----------------+----------------+
        |                                  |
        |                                  |
  Session Management                 Interactive UI
        |                                  |
        |
        v
+--------------------------------+
|        pi-agent-core            |
|                                |
|  Agent Loop                    |
|                                |
|  1. Receive message            |
|  2. Build context              |
|  3. Call LLM                   |
|  4. Execute tools              |
|  5. Update state               |
|  6. Repeat                     |
+--------------------------------+
              |
              |
              |
       +------+------+
       |             |
       v             v

   pi-ai          Tools
   LLM Layer      filesystem
                  bash
                  edit
                  browser
                  ...


       |
       v

 OpenAI
 Anthropic
 Gemini
 Bedrock
```





pi-ai 负责：

- provider 管理
- API 调用
- streaming
- token
- model catalog
- OAuth

pi-agent-core 负责

agent loop



思考：我可以把智能工厂和finwork的对接工程发包成sdk给大家，

比如说可以把他们封装成类似pi-ai的东西

pi-ai里面涉及到的核心概念

1.compat--对不同模型的备用处理方案，默认使用openAi的处理方式，其他的定制化方案都叫compat

|          | `compat.ts`                                              | `model.compat` / `getCompat()`                               |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| 层级     | 包级别入口模块                                           | 单个 `Model` 对象上的字段                                    |
| 作用     | 保留旧版全局 `stream()`/`getModel()` 等 API,供迁移期使用 | 描述某个具体模型/端点在协议细节上的差异（字段名、是否支持某参数等） |
| 生命周期 | 临时,迁移完成后删除 compat.ts:7-10                       | 长期存在,是 `Model` 类型的正式设计 types.ts:778-787          |
| 谁在用   | `pi-coding-agent` 的旧代码路径、扩展加载器               | 每个 API 实现内部（`openai-completions.ts` 等）在构造请求参数时使用 |
| 典型例子 | `import ... from "@earendil-works/pi-ai/compat"`         | `model.compat?.sup`                                          |



| 文件/概念 | 目的                                                         |                                             |
| --------- | ------------------------------------------------------------ | ------------------------------------------- |
| 1         | `packages/agent/docs/models.md` 全文                         | 理解整体设计意图和分层原则                  |
| 2         | `packages/ai/src/models.ts` (`Provider`、`Models`、`createModels`、`createProvider`) | 核心运行时接口与工厂函数                    |
| 3         | `packages/ai/src/api/*` 任选一个简单实现(如 openai-completions) | 了解 API 实现层如何对接真实 SDK             |
| 4         | `packages/ai/src/providers/*` 任选一个(如 openrouter,复用共享 API) | 了解 provider 工厂怎么组装 `createProvider` |
| 5         | `packages/ai/src/providers/all.ts`                           | 了解聚合入口/heavy entrypoint 的设计        |
| 6         | `packages/ai/README.md` "Development" 一节                   | 按 checklist 亲手加一个新 provider,验证理解 |

`models.ts`(Models 运行时)、`compat.ts`(兼容层)、`auth/`(认证)、`api/`(各 provider 的 API 实现)、`providers/`(具体 provider 工厂 + 生成的 catalog)

核心运行时 Models/createProvider、具体 provider 工厂如何组装、API 实现层的懒加载机制、faux 测试 provider,以及上层 pi-agent-core 和 pi-coding-agent 如何消费这套 API



PI里面写得好的函数

```ts
/**
 * Stop waiting for an operation when its signal aborts while continuing to
 * observe the abandoned promise so a later rejection is always handled.
 */
export function raceWithAbortSignal<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
	if (signal.aborted) {
		void operation.catch(() => {});
		return Promise.reject(abortReason(signal));
	}

	return new Promise<T>((resolve, reject) => {
		let settled = false;
		const cleanup = () => signal.removeEventListener("abort", onAbort);
		const onAbort = () => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(abortReason(signal));
		};

		signal.addEventListener("abort", onAbort, { once: true });
		void operation.then(
			(value) => {
				if (settled) return;
				settled = true;
				cleanup();
				resolve(value);
			},
			(error: unknown) => {
				if (settled) return;
				settled = true;
				cleanup();
				reject(error);
			},
		);
		if (signal.aborted) onAbort();
	});
}
```

