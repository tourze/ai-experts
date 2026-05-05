import {
  AgentSandbox,
  defineAgent,
  defineAgentWorkflow,
  defineAgentWorkflowGate,
  defineAgentWorkflowRoute,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { goCliSkill } from "../../skills/go-cli/index";
import { goGrpcSkill } from "../../skills/go-grpc/index";
import { goTroubleshootingSkill } from "../../skills/go-troubleshooting/index";
import { goConcurrencyPatternsSkill } from "../../skills/go-concurrency-patterns/index";
import { goTestingPatternsSkill } from "../../skills/go-testing-patterns/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { goErrorHandlingSkill } from "../../skills/go-error-handling/index";
import { goCodeStyleSkill } from "../../skills/go-code-style/index";
import { goPerformanceSkill } from "../../skills/go-performance/index";
import { goSecuritySkill } from "../../skills/go-security/index";
import { goDesignPatternsSkill } from "../../skills/go-design-patterns/index";
import { goLintSkill } from "../../skills/go-lint/index";
import { goStructsInterfacesSkill } from "../../skills/go-structs-interfaces/index";
import { goDataStructuresSkill } from "../../skills/go-data-structures/index";
import { goDatabaseSkill } from "../../skills/go-database/index";
import { goObservabilitySkill } from "../../skills/go-observability/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const goReviewerAgent = defineAgent({
  id: "go-reviewer",
  description: "当需要执行 Go 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  role: `你是资深 Go 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineAgentWorkflow({
    direction: "TD",
    gates: [
      defineAgentWorkflowGate({
        id: "gate-1",
        skill: goLintSkill.id,
        label: "门禁 1",
        checks: "静态问题：golangci-lint run 或等效。命名、格式、未使用导入、shadow",
      }),
      defineAgentWorkflowGate({
        id: "gate-2",
        skill: goSecuritySkill.id,
        label: "门禁 2",
        checks: "安全红线：SQL/命令注入、密钥硬编码、不安全加密、TLS 配置、模板注入",
      }),
      defineAgentWorkflowGate({
        id: "gate-3",
        skill: evidenceQualityFrameworkSkill.id,
        label: "门禁 3",
        checks: "每条结论标注事实/推断/假设",
      }),
    ],
    routes: [
      defineAgentWorkflowRoute({
        id: "route-go-concurrency-patterns",
        triggers: ["go func", "chan", "goroutine", "errgroup", "sync."],
        skill: goConcurrencyPatternsSkill.id,
        checks: "goroutine 生命周期、ctx.Done 传播、channel 关闭权归属、WaitGroup/errgroup 泄漏、select 缺 default",
        output: "并发安全结论 + 泄漏点列表",
      }),
      defineAgentWorkflowRoute({
        id: "route-go-error-handling",
        triggers: ["error", "errors.", "fmt.Errorf", "%w", "panic"],
        skill: goErrorHandlingSkill.id,
        checks: "错误链保留（%w vs %v）、sentinel error 稳定性、errors.Is/As、panic 边界、丢弃错误",
        output: "错误合同审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-go-structs-interfaces",
        triggers: ["interface", "struct", "func New", "type"],
        skill: goStructsInterfacesSkill.id,
        checks: "consumer-side interface、零值可用性、小接口、receiver 选择",
        output: "接口设计建议",
      }),
      defineAgentWorkflowRoute({
        id: "route-go-performance",
        triggers: ["性能声明或 benchmark 改动"],
        skill: goPerformanceSkill.id,
        checks: "要求 pprof/benchstat 证据链；无基线不接受结论",
        output: "性能证据验证",
      }),
      defineAgentWorkflowRoute({
        id: "route-go-database",
        triggers: ["sql", "db", "Query", "Transaction", "rows"],
        skill: goDatabaseSkill.id,
        checks: "事务边界、连接池配置、NULLable 列扫描、sql.Open 位置",
        output: "数据访问审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-go-grpc",
        triggers: ["proto", "grpc", "protobuf", "connect"],
        skill: goGrpcSkill.id,
        checks: "服务定义、拦截器链、错误码映射、stream 生命周期",
        output: "gRPC 审查",
      }),
      defineAgentWorkflowRoute({
        id: "route-go-observability",
        triggers: ["slog", "metric", "trace", "otel", "prometheus"],
        skill: goObservabilitySkill.id,
        checks: "日志级别、结构化字段、trace context 传播、指标命名",
        output: "可观测性审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-go-cli",
        triggers: ["cobra", "flag", "os.Exit", "main.go"],
        skill: goCliSkill.id,
        checks: "命令结构、flag 解析、配置分层、信号处理、退出码",
        output: "CLI 审查",
      }),
      defineAgentWorkflowRoute({
        id: "route-go-data-structures",
        triggers: ["[]byte", "map", "slice", "chan", "sync."],
        skill: goDataStructuresSkill.id,
        checks: "slice 容量增长、map 哈希桶、nil vs empty、泛型容器选型",
        output: "数据结构审查",
      }),
    ],
    finalSteps: [
      defineAgentWorkflowStep({
        id: "final-1",
        label: "门禁：go-lint → go-security → 确认基线干净",
      }),
      defineAgentWorkflowStep({
        id: "final-2",
        label: "路由：按 diff 内容匹配场景路由表，逐项深入",
      }),
      defineAgentWorkflowStep({
        id: "final-3",
        label: "证据：每条发现绑定 文件:行 + 代码片段",
      }),
      defineAgentWorkflowStep({
        id: "final-4",
        label: "标注：事实/推断/假设",
      }),
      defineAgentWorkflowStep({
        id: "final-5",
        label: "排序：安全 > 正确性 > 影响面 > 执行成本",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供只读代码审查的通用方法论和检查清单。",
    },
    {
      id: goCliSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 CLI 命令结构、flag 解析和退出码规范。",
    },
    {
      id: goGrpcSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 gRPC 服务定义、拦截器和流式生命周期。",
    },
    {
      id: goTroubleshootingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "识别运行时异常和构建失败的典型反模式。",
    },
    {
      id: goConcurrencyPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "检测 goroutine 泄漏和 channel 误用。",
    },
    {
      id: goTestingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "评估 Go 测试覆盖和 table-driven 用例质量。",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供通用测试方法论，补充 Go 特有审查视角。",
    },
    {
      id: goErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审计错误链保留和 panic 边界处理。",
    },
    {
      id: goCodeStyleSkill.id,
      mode: SkillUseMode.Preload,
      reason: "检查代码是否符合 Go 惯用风格。",
    },
    {
      id: goPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "要求性能声明有 benchmark 证据支撑。",
    },
    {
      id: goSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: "扫描注入、密钥硬编码等安全红线。",
    },
    {
      id: goDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "评估设计模式选型的合理性和可维护性。",
    },
    {
      id: goLintSkill.id,
      mode: SkillUseMode.Preload,
      reason: "通过门禁跑通 golangci-lint 静态检查基线。",
    },
    {
      id: goStructsInterfacesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查接口设计是否遵循 consumer-side 原则。",
    },
    {
      id: goDataStructuresSkill.id,
      mode: SkillUseMode.Preload,
      reason: "检查 slice/map 等数据结构的容量和边界使用。",
    },
    {
      id: goDatabaseSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审计事务边界、连接池和 SQL 安全。",
    },
    {
      id: goObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "检查日志级别、trace 传播和指标命名规范。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查结论标注事实/推断/假设。",
    }
  ],
});
