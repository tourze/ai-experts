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
import { laravelSecuritySkill } from "../laravel-security/index";

export const laravelVerificationSkill = defineSkill({
  id: "laravel-verification",
  fullName: "Laravel 验证循环",
  description: "当用户提到 Laravel 自检、发版前检查、CI 流水线、composer audit、phpstan、pint 或 migrate --pretend 时使用。",
  useCases: [
    "提交 PR 前、重构后、依赖升级后、预发布前需要跑一套完整的 Laravel 验证。",
    "需要把“本地能跑”提升为“格式、静态分析、测试、迁移和运行时配置都过关”。",
    "需要把验证命令落到 CI 或交接文档中。",
    "代码级实现和安全基线分别参考 `laravel-patterns` 与 `laravel-security`。",
  ],
  constraints: [
    "环境检查是第一关：PHP、Composer、Artisan、`.env` 与数据库连接不对时，后续命令没有意义。",
    "格式化和静态分析先于全量测试；测试先于迁移与部署缓存。",
    "迁移检查不仅看 `up()`，还要看 `down()`、幂等性、命名和破坏性变更。",
    "缓存预热、调度器、队列工作者属于运行时契约，不能只在 README 里假定它们存在。",
    "任何一步失败都必须阻断“准备发布”的结论，不能用手工解释覆盖掉红灯。",
  ],
  checklist: [
    "确认 PHP、Composer、Artisan 和 `.env` 与目标环境一致，`APP_DEBUG` 在生产为 `false`。",
    "`pint`、`phpstan` / `psalm`、测试、`composer audit` 全部通过后再看迁移与缓存命令。",
    "审查迁移文件名、破坏性 SQL、`down()` 回滚路径和是否需要灰度步骤。",
    "运行缓存预热后确认没有闭包路由、环境变量缺失或不可写目录问题。",
    "检查调度器、队列、Horizon、失败作业和健康检查队列是否符合目标环境配置。",
  ],
  relatedSkills: [
    {
      get id() {
        return laravelSecuritySkill.id;
      },
      reason: "验证失败涉及安全配置、密钥、CORS、上传、限流或生产 debug 时联动。",
    },
    {
      get id() {
        return laravelPatternsSkill.id;
      },
      reason: "验证失败指向控制器、模型、队列、路由或资源实现边界时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只跑测试就认为 OK",
      pass: "全链路验证",
    }),
    defineAntiPattern({
      fail: "本地成功 = 线上可行",
      pass: "预发复现线上配置",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认 PHP、Composer、Artisan、.env、数据库连接和目标环境配置。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按 composer validate、dump-autoload、pint、phpstan / psalm、test、composer audit、migration 顺序验证。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "迁移检查 `--pretend`、状态、回滚路径、破坏性变更和灰度步骤。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "环境、质量、迁移、缓存、调度、队列和 Horizon 命令读取 `verification-commands`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Laravel 验证命令清单、执行顺序和失败阻断点。",
      "迁移、缓存、队列、调度器、Horizon 和运行时配置风险。",
      "CI / 交接文档中应固化的命令和人工确认项。",
    ],
  }),
  references: [
    defineReference({
      id: "verification-commands",
      source: new URL("./references/verification-commands.md", import.meta.url),
      target: "references/verification-commands.md",
      title: "Laravel 验证命令",
      summary: "PHP、Composer、Artisan、Pint、PHPStan、测试、审计、迁移、缓存、调度和队列检查命令。",
      loadWhen: "需要快速组装 Laravel 本地或 CI 验证命令链时读取。",
    }),
  ],
});
