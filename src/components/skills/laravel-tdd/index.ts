import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { laravelPatternsSkill } from "../laravel-patterns/index";
import { laravelVerificationSkill } from "../laravel-verification/index";
import { phpTestingSkill } from "../php-testing/index";

export const laravelTddSkill = defineSkill({
  id: "laravel-tdd",
  fullName: "Laravel TDD 工作流",
  description: "当用户提到 Laravel 测试、Pest、PHPUnit、RefreshDatabase、Queue::fake 或 HTTP fake 时使用。非 Laravel 的 PHP 项目改用 `php-testing`。",
  useCases: [
    "Laravel 新功能、Bug 修复、重构、授权规则或副作用链路需要先写测试再实现。",
    "需要测试 HTTP 端点、Eloquent 模型、策略、队列作业、通知和 Sanctum 认证。",
    "需要把回归范围从“手点一下”提升到可重复执行的自动化验证。",
    "发布前整体验证看 `laravel-verification`，实现边界约束看 `laravel-patterns`。",
  ],
  constraints: [
    "保持红绿重构循环：先写失败测试，再做最小实现，再清理结构。",
    "优先用 Pest 写新测试；只有项目已有 PHPUnit 约定或需要特定基类时才回退 PHPUnit。",
    "触库测试默认 `RefreshDatabase`；外部副作用默认 `Queue::fake()`、`Event::fake()`、`Http::fake()`。",
    "一个测试只验证一个行为边界：成功、授权失败、验证失败、外部依赖失败分开覆盖。",
    "覆盖率只是结果，不是借口；关键路径没有断言细节时，80% 也可能毫无意义。",
  ],
  checklist: [
    "新增入口前先定义成功路径，再补授权失败和验证失败。",
    "触及数据库时确认是否需要工厂状态、软删除断言、资源断言或 JSON 结构断言。",
    "引入队列、事件、通知、HTTP 客户端时，先决定 fake 的边界和需要断言的副作用。",
    "测试名称直接描述业务行为，不写 `test_1` 或“should work”。",
    "合并前至少能回答：哪些行为被测试锁住了，哪些风险仍靠人工验证。",
  ],
  relatedSkills: [
    {
      get id() {
        return laravelPatternsSkill.id;
      },
      reason: "测试暴露控制器、Action、模型关系、队列或资源边界设计问题时联动。",
    },
    {
      get id() {
        return laravelVerificationSkill.id;
      },
      reason: "需要把局部测试扩展为发布前完整验证命令链时联动。",
    },
    {
      get id() {
        return phpTestingSkill.id;
      },
      reason: "项目不是 Laravel，或测试问题主要是 PHPUnit / Pest 的 PHP 通用语法、fixture、mock 与配置时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "真实调用外部服务",
      pass: "Fake + 断言副作用",
    }),
    defineAntiPattern({
      fail: "一个测试断言多个行为",
      pass: "一个测试一个行为",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先写成功路径失败测试，再补授权失败、验证失败和外部依赖失败。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "触库测试默认 RefreshDatabase；队列、事件、通知和 HTTP 客户端默认 fake 并断言副作用。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "一个测试只覆盖一个行为边界，名称直接描述业务行为。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "Pest HTTP + Queue fake 和 PHPUnit Action 示例读取 `test-code-patterns`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试用例、fixture / factory、fake 边界和断言策略。",
      "成功、授权失败、验证失败、外部依赖失败和副作用覆盖矩阵。",
      "仍需人工验证或发布前命令验证的风险。",
    ],
  }),
  references: [
    defineReference({
      id: "test-code-patterns",
      source: new URL("./references/test-code-patterns.md", import.meta.url),
      target: "references/test-code-patterns.md",
      title: "Laravel 测试代码模式",
      summary: "Pest HTTP 测试、Queue::fake、Sanctum 和 PHPUnit Action 单测示例。",
      loadWhen: "需要快速编写 Laravel HTTP / Action / Queue 测试时读取。",
    }),
  ],
});
