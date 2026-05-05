import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const memorySafetyPatternsSkill = defineSkill({
  id: "memory-safety-patterns",
  fullName: "Memory Safety Patterns",
  description: "在编写或评审 C/C++ 系统代码、梳理资源所有权或修复内存安全问题时使用。",
  useCases: [
    "你在 C/C++ 里申请或持有资源：`FILE*`、socket、锁、堆内存、线程句柄、`new` 出来的对象。",
    "你在改老代码，想把“谁负责释放”从口头约定变成编译期约束。",
    "你在排查泄漏、双重释放、悬空指针、异常路径资源遗失。",
    "你在设计 C API / C++ 封装边界，需要明确 owning pointer、observer pointer、borrowed view。",
    "你在评审代码，怀疑 `shared_ptr`、裸指针或 cleanup 路径已经失控。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for memory-safety-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
