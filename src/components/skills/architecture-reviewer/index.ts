import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, architectureReviewerScanCodebase } from "../../procedures/index";
import { apiTraceReaderSkill } from "../api-trace-reader/index";
import { refactoringPatternsSkill } from "../refactoring-patterns/index";

export const architectureReviewerSkill = defineSkill({
  id: "architecture-reviewer",
  fullName: "architecture-reviewer",
  description: "当用户要评审架构设计、代码库结构、技术文档或企业就绪风险时使用。",
  useCases: [
    "适合技术尽调、上线前审计、扩容评估、企业合规审查和架构争议仲裁。",
    "支持代码库评审、文档评审和混合评审三种模式；深挖时启用 Exhaustive 模式做子系统级穷举审计。",
    "需要输出七维架构评分、关键风险、修复优先级和可追溯证据。",
  ],
  constraints: [
    "必须先判断输入模式与深度（Quick / Exhaustive），再决定是否运行扫描脚本和加载参考文件。",
    "评分只允许 `1` 到 `5`，可用 `0.5`；不得改成百分制单维评分。",
    "七个维度都要覆盖：结构、扩展性、安全、性能、企业就绪、运维、数据架构。",
    "每个结论都要绑定证据：代码路径、配置项、文档原文或用户明确提供的事实。",
    "Exhaustive 模式必须先做子系统拆分、再分模块审，不能一口气混着看；优先审有状态、有副作用、并发、认证、安全边界的模块。",
  ],
  checklist: [
    "是否写清了评审模式、假设、输入边界和证据来源。",
    "是否标记了 S1 到 S5 风险等级和修复顺序。",
    "是否区分“当前实现问题”与“文档缺口/待确认项”。",
    "是否给出可执行的整改建议，而不是空泛建议。",
  ],
  relatedSkills: [
    {
      get id() {
        return apiTraceReaderSkill.id;
      },
      reason: "需要把请求链路、调用路径或跨服务 API 行为作为架构证据时联动。",
    },
    {
      get id() {
        return refactoringPatternsSkill.id;
      },
      reason: "模块接缝、遗留代码隔离测试或 seam-ripper 类重构策略需要落到代码级改造时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "跳过输入分类",
      pass: "先扫描再评",
    }),
    defineAntiPattern({
      fail: "风险列表无优先级",
      pass: "S1-S5 + 修复顺序",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先判断输入模式：代码库、文档或混合；再选择 Quick 或 Exhaustive 深度。",
      "代码库模式先调用 architecture-reviewer-scan-codebase 获取结构指纹，再只读取当前维度需要的 reference。",
      "按结构、扩展性、安全、性能、企业就绪、运维、数据架构七维覆盖证据，不把单点印象当总评。",
      "Exhaustive 模式先列子系统清单：模块、文件范围、优先级、副作用；优先审状态、副作用、并发、认证和安全边界。",
      "逐子系统审计后合并重复根因，区分现象与根因，按 Critical/High/Medium/Low 或 S1-S5 给修复顺序。",
      "需要画图读取 architecture-diagram reference；需要蓝图读取 architecture-blueprint-generator。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "评审模式、输入边界、假设、扫描结果和证据来源。",
      "七维评分总览、关键风险、分维度结论、S1-S5 或 Critical/High/Medium/Low 排序。",
      "子系统清单、重复根因合并、修复优先级、待确认项和可执行整改建议。",
    ],
  }),
  tools: [],
  procedures: [
    procedureUse(architectureReviewerScanCodebase),
  ],
  references: [
    defineReference({
      id: "architecture-blueprint-generator",
      source: new URL("./references/architecture-blueprint-generator.md", import.meta.url),
      target: "references/architecture-blueprint-generator.md",
      title: "architecture-blueprint-generator.md",
      summary: "架构蓝图生成指南：从源码扫描到模块边界图的自动化流程。",
      loadWhen: "需要自动生成架构蓝图或进行子系统级结构分析时读取。",
    }),
    defineReference({
      id: "architecture-diagram",
      source: new URL("./references/architecture-diagram.md", import.meta.url),
      target: "references/architecture-diagram.md",
      title: "architecture-diagram.md",
      summary: "架构图绘制规范与工具指南：C4 模型、组件图与部署图。",
      loadWhen: "需要绘制架构图或使用架构图辅助评审时读取。",
    }),
    defineReference({
      id: "codebase-signals",
      source: new URL("./references/codebase-signals.md", import.meta.url),
      target: "references/codebase-signals.md",
      title: "codebase-signals.md",
      summary: "代码库健康信号识别：高 Churn 文件、God 模块与循环依赖检测。",
      loadWhen: "需要快速识别代码库中的结构风险信号时读取。",
    }),
    defineReference({
      id: "data-architecture",
      source: new URL("./references/data-architecture.md", import.meta.url),
      target: "references/data-architecture.md",
      title: "data-architecture.md",
      summary: "数据架构评审维度：数据流、存储方案、一致性与备份策略。",
      loadWhen: "需要评审数据架构或评估数据层设计方案时读取。",
    }),
    defineReference({
      id: "document-review-guide",
      source: new URL("./references/document-review-guide.md", import.meta.url),
      target: "references/document-review-guide.md",
      title: "document-review-guide.md",
      summary: "技术文档评审指南：完整性、一致性、可执行性评估标准。",
      loadWhen: "需要执行文档评审模式或以文档为主体的架构审计时读取。",
    }),
    defineReference({
      id: "enterprise-readiness",
      source: new URL("./references/enterprise-readiness.md", import.meta.url),
      target: "references/enterprise-readiness.md",
      title: "enterprise-readiness.md",
      summary: "企业就绪度评估：合规、审计、SLA、多租户与治理要求。",
      loadWhen: "需要评审企业级项目合规性或评估投产就绪度时读取。",
    }),
    defineReference({
      id: "operational-excellence",
      source: new URL("./references/operational-excellence.md", import.meta.url),
      target: "references/operational-excellence.md",
      title: "operational-excellence.md",
      summary: "运维卓越性评审维度：监控、告警、部署、容灾与故障恢复。",
      loadWhen: "需要评估运维体系或评审系统可观测性设计时读取。",
    }),
    defineReference({
      id: "performance",
      source: new URL("./references/performance.md", import.meta.url),
      target: "references/performance.md",
      title: "performance.md",
      summary: "性能架构评审维度：吞吐量、延迟、资源利用率与瓶颈分析。",
      loadWhen: "需要评审系统性能设计或评估扩容方案时读取。",
    }),
    defineReference({
      id: "scalability",
      source: new URL("./references/scalability.md", import.meta.url),
      target: "references/scalability.md",
      title: "scalability.md",
      summary: "扩展性架构评审维度：水平扩展、数据分片、无状态设计与缓存策略。",
      loadWhen: "需要评审系统扩展性方案或评估架构未来增长能力时读取。",
    }),
    defineReference({
      id: "scoring-rubric",
      source: new URL("./references/scoring-rubric.md", import.meta.url),
      target: "references/scoring-rubric.md",
      title: "scoring-rubric.md",
      summary: "架构评审七维度评分标准：1-5 分评分细则与证据要求。",
      loadWhen: "需要制定量化评分或确保评审维度一致性时读取。",
    }),
    defineReference({
      id: "security",
      source: new URL("./references/security.md", import.meta.url),
      target: "references/security.md",
      title: "security.md",
      summary: "安全架构评审维度：认证授权、数据加密、输入校验与安全边界。",
      loadWhen: "需要评审系统安全设计或评估安全合规风险时读取。",
    }),
    defineReference({
      id: "structural-integrity",
      source: new URL("./references/structural-integrity.md", import.meta.url),
      target: "references/structural-integrity.md",
      title: "structural-integrity.md",
      summary: "结构完整性评审维度：模块边界、依赖方向、分层违规与循环依赖。",
      loadWhen: "需要评估代码库模块结构或检查分层违规时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "report-template",
      source: new URL("./assets/report-template.md", import.meta.url),
      target: "assets/report-template.md",
    })
  ],
});
