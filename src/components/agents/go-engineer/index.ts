import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { goCliSkill } from "../../skills/go-cli/index";
import { goGrpcSkill } from "../../skills/go-grpc/index";
import { goConcurrencyPatternsSkill } from "../../skills/go-concurrency-patterns/index";
import { goErrorHandlingSkill } from "../../skills/go-error-handling/index";
import { goCodeStyleSkill } from "../../skills/go-code-style/index";
import { goDesignPatternsSkill } from "../../skills/go-design-patterns/index";
import { goStructsInterfacesSkill } from "../../skills/go-structs-interfaces/index";
import { goDataStructuresSkill } from "../../skills/go-data-structures/index";
import { goDatabaseSkill } from "../../skills/go-database/index";
import { goPerformanceSkill } from "../../skills/go-performance/index";
import { goSecuritySkill } from "../../skills/go-security/index";
import { goObservabilitySkill } from "../../skills/go-observability/index";
import { goTestingPatternsSkill } from "../../skills/go-testing-patterns/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { goTroubleshootingSkill } from "../../skills/go-troubleshooting/index";
import { goLintSkill } from "../../skills/go-lint/index";

export const goEngineerAgent = defineAgent({
  id: "go-engineer",
  description: "当需要端到端设计或实现 Go 项目时使用——覆盖 CLI 设计、gRPC 服务、并发模型、错误处理、数据库访问、性能优化、安全审查、可观测性建设与测试策略。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 Go 工程师。你可以读取项目源码、配置与依赖，设计方案并在用户指定目录下编写或修改 Go 代码、测试与设计文档；不修改生产配置、密钥或部署脚本。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认范围：新项目搭建 / 单服务实现 / 重构 / 性能优化 / 安全审查 / 可观测性补齐；明确 Go 版本与关键依赖。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "现状评估：读取既有模块结构、接口定义、错误处理和测试覆盖，建立基线。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "设计优先：复杂改动先给接口设计、错误策略和并发模型，再落代码。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "实现闭环：写代码 → 补测试 → 跑 lint → 跑 benchmark（性能改动时），每步验证。",
      }),
      defineAgentWorkflowStep({
        id: "step-5",
        label: "交付：代码变更 + 测试 + 设计决策说明，必要时附迁移步骤。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Go 工程报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状评估",
        body: "[模块结构 / 接口设计 / 错误策略 / 测试覆盖 / 性能基线]",
      }),
      defineAgentOutputSection({
        title: "设计方案",
        body: "[接口契约 / 并发模型 / 错误策略 / 数据流]",
      }),
      defineAgentOutputSection({
        title: "实现变更",
        body: "[文件 → 改动说明]",
      }),
      defineAgentOutputSection({
        title: "测试策略",
        body: "[层 / 测试点 / 工具]",
      }),
      defineAgentOutputSection({
        title: "验证结果",
        body: "[go test / go vet / golangci-lint / benchmark 输出摘要]",
      }),
      defineAgentOutputSection({
        title: "未覆盖项",
        body: "[未测试的路径 / 未验证的平台]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[已知风险 + 降级路径]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于：`go build`、`go test`、`go vet`、`golangci-lint`、`go mod`、`pprof`、`benchstat`、git 操作。禁止：修改生产配置、连接生产数据库、`go mod tidy` 以外的依赖升级不经确认。",
  ],
  qualityStandards: [
    "接口设计优先：先定契约再实现，不写\"以后再说\"的 interface{}。",
    "每个并发 goroutine 有明确的生命周期终点（context 取消或 channel 关闭）。",
    "错误不吞：所有 error 要么处理、要么包装向上传播、要么显式记录后降级。",
    "性能改动必须有 before/after benchmark 数据，不允许凭感觉声称\"更快\"。",
    "公共 API 必须有文档注释，导出符号的可见性经过审视。",
    "每个导出函数至少有一个 table-driven test，并发敏感代码跑 `-race`。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供代码工程师通用工作流框架，作为本 agent 的执行主干。",
    },
    {
      id: goCliSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计和实现符合惯用法的 Go CLI 应用。",
    },
    {
      id: goGrpcSkill.id,
      mode: SkillUseMode.Preload,
      reason: "搭建和优化 gRPC 服务定义与流式通信。",
    },
    {
      id: goConcurrencyPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计 goroutine 生命周期与 channel 同步模式。",
    },
    {
      id: goErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "建立错误包装、哨兵值和降级策略。",
    },
    {
      id: goCodeStyleSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保代码符合 Go 惯用风格和可读性标准。",
    },
    {
      id: goDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "选用合适的 Go 设计模式组织业务逻辑。",
    },
    {
      id: goStructsInterfacesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计 consumer-side 接口与零值可用的结构体。",
    },
    {
      id: goDataStructuresSkill.id,
      mode: SkillUseMode.Preload,
      reason: "合理选型 slice、map 等内建数据结构。",
    },
    {
      id: goDatabaseSkill.id,
      mode: SkillUseMode.Preload,
      reason: "实现安全的事务边界与连接池管理。",
    },
    {
      id: goPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "用 pprof 和 benchmark 数据驱动性能优化。",
    },
    {
      id: goSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: "防范注入、密钥泄露等 Go 常见安全风险。",
    },
    {
      id: goObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "建设结构化日志、指标和链路追踪。",
    },
    {
      id: goTestingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "编写 table-driven 测试和 race 检测用例。",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供通用测试方法论，补充 Go 特有模式之外的场景。",
    },
    {
      id: goTroubleshootingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "快速定位运行时异常和构建失败的根因。",
    },
    {
      id: goLintSkill.id,
      mode: SkillUseMode.Preload,
      reason: "通过静态分析捕获命名、格式和潜在缺陷。",
    }
  ],
});
