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

export const laravelPatternsSkill = defineSkill({
  id: "laravel-patterns",
  fullName: "Laravel 开发模式",
  description: "当用户需要处理 Laravel 分层架构、Service/Action 边界、Eloquent 模型、Migration、FormRequest、JsonResource、Job、Livewire、scopeBindings、多租户路由或 N+1 问题时使用。",
  useCases: [
    "设计或重构控制器、Action、Service、Query Object、API 资源和队列作业边界。",
    "需要从需求直接落到 Artisan 命令、Eloquent 关系、FormRequest、JsonResource 或 Livewire 组件。",
    "深入专题按需加载：`references/eloquent.md`、`routing.md`、`queues.md`、`livewire.md`、`testing.md`。",
    "架构边界/安全/测试/发布检查切换到 `laravel-security`、`laravel-tdd`、`laravel-verification`。",
  ],
  constraints: [
    "目标默认 Laravel 10+ / PHP 8.2+，使用严格类型、枚举、只读依赖和返回类型。",
    "控制器只做授权、参数接收和响应封装；校验 → `FormRequest`，序列化 → `JsonResource`，业务逻辑 → Action/Service。",
    "嵌套路由使用 `scopeBindings()`；路由绑定提升可预测性，但不能代替策略或 `authorize()`。",
    "关系查询默认 `with()` / `load()`，不要把 N+1 留给调用方。",
    "多表写操作放事务中；缓存命中必须成对设计失效策略（推荐模型事件绑定）。",
    "耗时副作用默认入队，失败路径必须可观察。",
    "API 响应统一走 `JsonResource` / `ResourceCollection`，包含 `data`、`meta`、`error` 约定字段。",
    "配置与密钥留在 `config/*` 和环境变量，禁止硬编码环境差异。",
  ],
  checklist: [
    "每个 HTTP 入口能回答：控制器/FormRequest/Action/Resource 各负责什么。",
    "嵌套资源启用 `scopeBindings()` 且 Policy 覆盖真正访问控制。",
    "模型变更同步检查 `$fillable`、`$casts`、关系、策略和资源输出。",
    "多表写操作在事务中，缓存失效绑定模型生命周期。",
    "N+1 已排查：列表/详情/嵌套资源都用了 `with()` 或 `load()`。",
    "引入后台任务时同步检查幂等、重试、失败日志和 queue 配置。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "控制器同步编排副作用",
      pass: "Action + Job 异步",
    }),
    defineAntiPattern({
      fail: "N+1 懒加载",
      pass: "用 eager loading 或 constrained eager loading，并验证查询数。",
    }),
    defineAntiPattern({
      fail: "缓存只加不失效",
      pass: "为缓存定义失效事件、TTL 和 key version。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认 HTTP 入口、授权点、校验边界、业务动作、模型关系、响应资源和副作用是否需要队列。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "控制器保持薄化：授权、接收参数、调用 Action / Service、返回 JsonResource。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "模型同步检查 fillable、casts、relation、scope、Policy、Resource 和 N+1 查询。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "控制器 + Action + FormRequest 示例读取 `http-action-patterns`；Eloquent、routing、queues、livewire、testing 深入内容读取对应 references。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Controller / FormRequest / Action / Model / Resource 职责拆分。",
      "Eloquent 关系、scopeBindings、Policy、事务、缓存失效和队列边界建议。",
      "需要补的测试、N+1 验证和发布前检查项。",
    ],
  }),
  references: [
    defineReference({
      id: "http-action-patterns",
      source: new URL("./references/http-action-patterns.md", import.meta.url),
      target: "references/http-action-patterns.md",
      title: "Laravel HTTP Action 模式",
      summary: "控制器、Action、FormRequest、Eloquent Model、scopeBindings 和 Policy 示例。",
      loadWhen: "需要快速设计 Laravel HTTP 入口、Action 或模型规范时读取。",
    }),
    defineReference({
      id: "eloquent",
      source: new URL("./references/eloquent.md", import.meta.url),
      target: "references/eloquent.md",
      title: "eloquent.md",
      summary: "Eloquent ORM 高级用法：关系定义、scope、withCount、子查询与性能优化。",
      loadWhen: "需要设计或优化 Eloquent 模型关系与查询时读取。",
    }),
    defineReference({
      id: "livewire",
      source: new URL("./references/livewire.md", import.meta.url),
      target: "references/livewire.md",
      title: "livewire.md",
      summary: "Livewire 组件开发：状态管理、事件通信、表单验证与组件复用模式。",
      loadWhen: "需要开发 Livewire 动态组件或处理前后端交互时读取。",
    }),
    defineReference({
      id: "queues",
      source: new URL("./references/queues.md", import.meta.url),
      target: "references/queues.md",
      title: "queues.md",
      summary: "Laravel 队列：Job 设计、队列配置、失败重试与监控集成的最佳实践。",
      loadWhen: "需要设计异步 Job 或配置队列驱动和重试策略时读取。",
    }),
    defineReference({
      id: "routing",
      source: new URL("./references/routing.md", import.meta.url),
      target: "references/routing.md",
      title: "routing.md",
      summary: "Laravel 路由设计：隐式绑定、scopeBindings、资源路由与 API 版本管理。",
      loadWhen: "需要设计路由结构、嵌套绑定或 API 路由组织时读取。",
    }),
    defineReference({
      id: "testing",
      source: new URL("./references/testing.md", import.meta.url),
      target: "references/testing.md",
      title: "testing.md",
      summary: "Laravel 测试实践：HTTP 测试、数据库测试、Mock 与 Browser 测试的模式。",
      loadWhen: "需要编写或审查 Laravel 应用的测试用例时读取。",
    }),
  ],
});
