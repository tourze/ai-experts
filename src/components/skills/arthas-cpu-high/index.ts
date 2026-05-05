import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { arthasSpringcontextIssuesResolveSkill } from "../arthas-springcontext-issues-resolve/index";

export const arthasCpuHighSkill = defineSkill({
  id: "arthas-cpu-high",
  fullName: "Arthas CPU 飙高排查",
  description: "当 JVM 或 Java 应用 CPU 飙高、负载异常时使用。",
  useCases: [
    "Java 进程 CPU 飙高、请求明显变慢、机器负载异常升高。",
    "需要快速确认是计算热点、锁竞争、GC 压力还是日志/序列化开销。",
    "已能连到目标 JVM，并且允许使用 Arthas 做只读诊断。",
    "如果怀疑是 Spring Bean 装配或配置注入问题，转到 `arthas-springcontext-issues-resolve`。",
  ],
  constraints: [
    "先只读、后追踪：必须先拿到 `dashboard` 与 `thread` 证据，再决定是否使用 `trace` / `watch`。",
    "严格限量：`-n`、`-c`、条件表达式和目标类名必须收敛，避免把线上 JVM 打成第二次故障。",
    "先定位线程，再确认方法：不要一上来对整个包做 `trace` 或 `watch`。",
    "输出必须带证据：至少包含线程 ID、线程状态、关键堆栈和推断原因，不能只给口头结论。",
  ],
  checklist: [
    "是否先执行了 `dashboard` 和 `thread -n N`，而不是直接上重型命令。",
    "是否记录了热点线程的 `threadId`、线程名、状态和关键方法。",
    "如果出现大量 `BLOCKED`，是否继续定位阻塞源头，而不是把阻塞线程误判为 CPU 热点。",
    "`trace` / `watch` 是否限制了类名、方法名、次数和条件表达式。",
    "报告里是否明确区分“观察到的事实”和“基于事实的推断”。",
  ],
  relatedSkills: [
    {
      get id() {
        return arthasSpringcontextIssuesResolveSkill.id;
      },
      reason: "如果怀疑是 Spring Bean 装配或配置注入问题，转到 `arthas-springcontext-issues-resolve`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "对主包直接 trace",
      pass: "先定位再收敛",
    }),
    defineAntiPattern({
      fail: "只给结论不给证据",
      pass: "证据驱动的结论",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
