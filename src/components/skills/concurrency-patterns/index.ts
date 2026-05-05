import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const concurrencyPatternsSkill = defineSkill({
  id: "concurrency-patterns",
  fullName: "并发模式",
  description: "当需要设计或审查并发/异步代码时使用。语言无关的通用并发原则：不阻塞、限制并发、传播取消、不共享可变状态、超时所有外部调用。",
  useCases: [
    "需要设计异步任务、并发请求、事件循环或后台 worker。",
    "需要排查竞态条件、死锁、goroutine/task 泄漏或内存可见性问题。",
    "需要在各语言落地时加载对应语言 skill：各语言版提供具体语法和惯用写法。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
