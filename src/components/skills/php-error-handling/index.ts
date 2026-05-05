import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { phpTestingSkill } from "../php-testing/index";
import { phpTypeSafetySkill } from "../php-type-safety/index";

export const phpErrorHandlingSkill = defineSkill({
  id: "php-error-handling",
  fullName: "PHP 错误处理",
  description: "当用户要设计 PHP 异常层级、实现输入校验边界、做错误映射、处理批量部分失败或规范 try/catch 纪律时使用。",
  useCases: [
    "API、CLI、队列 worker 需要稳定处理坏输入和外部依赖失败。",
    "需要建立统一异常层级和用户可见错误映射。",
    "批处理场景要区分\"全部失败\"和\"部分失败\"。",
  ],
  constraints: [
    "只捕获你能处理的异常类型；其余保留堆栈继续抛出。",
    "用户可见消息与内部调试细节分离，不暴露 SQL、路径、堆栈。",
    "用户输入必须在进入业务逻辑前完成校验和归一化。",
  ],
  checklist: [
    "异常分为验证层、业务层、外部依赖层。",
    "try/catch 只出现在真正需要处理或转换异常的地方。",
    "用户可见错误消息不包含堆栈、SQL、文件路径。",
    "批量处理有部分失败汇总机制。",
  ],
  relatedSkills: [
    {
      get id() {
        return phpTypeSafetySkill.id;
      },
      reason: "联动：`php-testing` · `php-type-safety`。",
    },
    {
      get id() {
        return phpTestingSkill.id;
      },
      reason: "联动：`php-testing` · `php-type-safety`",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "吞异常返 false/null",
      pass: "异常类型化",
    }),
    defineAntiPattern({
      fail: "直接返回 getMessage",
      pass: "用户消息 vs 内部细节",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for php-error-handling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
