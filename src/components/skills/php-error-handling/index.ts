import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
      get skill() {
        return phpTypeSafetySkill;
      },
      reason: "异常类型、错误响应和批处理结果需要精确 PHPDoc / 静态分析表达时联动。",
    },
    {
      get skill() {
        return phpTestingSkill;
      },
      reason: "需要覆盖输入校验、业务异常、外部依赖失败或部分失败路径时联动。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先划分验证错误、业务规则错误、外部依赖错误和系统故障，不在全局 catch 里吞掉未知异常。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "用户可见消息与内部调试细节分离，禁止暴露 SQL、文件路径、堆栈和敏感数据。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "批量处理要保留成功项、失败项和失败原因；try/catch 只放在需要处理或转换异常的边界。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "异常层级速查读取 `error-boundary-map`；具体输入校验和错误映射代码读取 `patterns`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "异常层级、捕获边界、用户错误映射和内部日志策略。",
      "批处理部分失败结构、外部依赖包装和重试边界。",
      "需要补的错误路径测试、类型标注和泄露风险。",
    ],
  }),
  references: [
    defineReference({
      id: "error-boundary-map",
      source: new URL("./references/error-boundary-map.md", import.meta.url),
      target: "references/error-boundary-map.md",
      title: "PHP 异常边界图",
      summary: "DomainException、ValidationException、BusinessRuleException 和 ExternalServiceException 的层级速查。",
      loadWhen: "需要快速设计 PHP 异常层级或判断错误边界时读取。",
    }),
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "PHP 错误处理模式汇总，包括异常层级设计、输入校验、错误映射等。",
      loadWhen: "需要查阅 PHP 异常层级设计或错误处理的具体实现模式时读取。",
    }),
  ],
});
