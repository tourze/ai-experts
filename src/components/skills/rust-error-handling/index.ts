import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { rustAsyncPatternsSkill } from "../rust-async-patterns/index";
import { rustOwnershipIdiomsSkill } from "../rust-ownership-idioms/index";
import { rustTestingSkill } from "../rust-testing/index";

export const rustErrorHandlingSkill = defineSkill({
  id: "rust-error-handling",
  fullName: "Rust 错误处理",
  description: "当用户要设计 Rust 错误类型、选择 thiserror 还是 anyhow、规范 Result 用法、消除 unwrap 或在 async 边界传播错误时使用。",
  useCases: [
    "设计库或应用的错误类型层级。",
    "在 thiserror（库）和 anyhow（二进制入口）之间做选择。",
    "消除生产代码中的 `unwrap()` / `expect()`。",
    "在 async 边界正确传播和转换错误。",
  ],
  constraints: [
    "库 crate 暴露稳定、可匹配的错误类型（用 `thiserror`）。",
    "应用二进制入口才适合 `anyhow::Result` 兜底。",
    "`unwrap()` / `expect()` 只在测试、脚本和进程启动 fail-fast 中使用。",
    "`?` 操作符是传播首选；手动 `match` 只在需要转换或添加上下文时。",
    "错误信息小写开头、不带句号。",
    "公共函数的 `# Errors` 文档段落解释什么条件下返回哪种错误。",
  ],
  relatedSkills: [
    {
      get id() {
        return rustTestingSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-testing` · `rust-async-patterns`。",
    },
    {
      get id() {
        return rustAsyncPatternsSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-testing` · `rust-async-patterns`。",
    },
    {
      get id() {
        return rustOwnershipIdiomsSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-testing` · `rust-async-patterns`",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "库 crate 暴露 anyhow",
      pass: "库用 thiserror，二进制用 anyhow",
    }),
    defineAntiPattern({
      fail: "unwrap 代替校验",
      pass: "传播错误 + 上下文",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chapter-04",
      source: new URL("./references/chapter_04.md", import.meta.url),
      target: "references/chapter_04.md",
      title: "chapter_04.md",
      summary: "thiserror 与 anyhow 的选择决策树、错误类型层级设计与常见反模式对照。",
      loadWhen: "需要设计库或应用的错误类型、在 thiserror 和 anyhow 间决策或消除 unwrap 时读取。",
    }),
  ],
});
