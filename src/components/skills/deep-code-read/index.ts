import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const deepCodeReadSkill = defineSkill({
  id: "deep-code-read",
  fullName: "Deep Code Reader",
  description: "当用户要深度理解不熟悉代码库，并生成可复用的认知型 skill 文件时使用。",
  useCases: [
    "用户要深度理解陌生代码库，而不是只做快速仓库体检。",
    "用户希望把代码库知识沉淀成可复用 skill。",
    "用户能接受多轮闭卷验证，要求产出可被问答检验。",
  ],
  constraints: [
    "源码只读，全程不修改",
    "Agent 隔离：A 读码写 skill，B 读码出题，C 只读 skill 答题",
    "验证必须 100% 通过或跑满 3 轮，99% 不算通过",
    "每个模块用 task 跟踪进度",
  ],
  checklist: [
    "是否已确认源码版本、分支或 tag，并在输出中记录证据？",
    "已选择模块边界并完成逐模块精读。",
    "ABC 闭卷验证通过或记录了 3 轮失败原因。",
    "生成的 skill 是否能独立回答验收问题，并附上问答证据？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "快速扫描后直接写结论：只看 README 和目录树就生成 skill，无法回答实现细节问题。",
      pass: "闭卷验证驱动：让出题者基于源码提问，让答题者只读 skill 作答，用失败问题反向补齐 skill。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认源码版本、分支/tag、输出目录和只读边界；执行前读取 workflow reference。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "准备阶段定位仓库并检测版本；扫描阶段识别模块边界、依赖和精读顺序，必要时读取 repo-analyzer。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "Agent A 逐模块读源码并写 skill，Agent B 基于源码出题，Agent C 只读生成的 skill 答题。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "闭卷验证必须 100% 通过或跑满 3 轮；失败问题反向补齐 skill，99% 不算通过。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "生成全局 index skill 后做用户问答验收，最后询问是否清理克隆源码。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "仓库版本、模块边界、精读进度、使用的 Agent prompt reference 和只读保证。",
      "生成的模块 skill、全局 index skill、验收问题、回答结果和失败修正记录。",
      "3 轮验证结果、未覆盖问题、最终可复用 skill 输出目录和清理建议。",
    ],
  }),
  references: [
    defineReference({
      id: "agent-a-prompt",
      source: new URL("./references/agent-a-prompt.md", import.meta.url),
      target: "references/agent-a-prompt.md",
      title: "agent-a-prompt.md",
      summary: "Agent A（代码阅读与 skill 撰写）的系统提示词与工作流程。",
      loadWhen: "需要指派 Agent A 执行代码阅读和 skill 文件撰写任务时读取。",
    }),
    defineReference({
      id: "agent-b-prompt",
      source: new URL("./references/agent-b-prompt.md", import.meta.url),
      target: "references/agent-b-prompt.md",
      title: "agent-b-prompt.md",
      summary: "Agent B（出题验证者）的系统提示词与验收问题生成规范。",
      loadWhen: "需要指派 Agent B 基于源码生成验收问题用于闭卷验证时读取。",
    }),
    defineReference({
      id: "agent-c-prompt",
      source: new URL("./references/agent-c-prompt.md", import.meta.url),
      target: "references/agent-c-prompt.md",
      title: "agent-c-prompt.md",
      summary: "Agent C（闭卷答题者）的系统提示词与答题规则。",
      loadWhen: "需要指派 Agent C 仅基于生成的 skill 回答验收问题以验证完整性时读取。",
    }),
    defineReference({
      id: "repo-analyzer",
      source: new URL("./references/repo-analyzer.md", import.meta.url),
      target: "references/repo-analyzer.md",
      title: "repo-analyzer.md",
      summary: "代码仓库结构分析与模块边界识别的方法与提示词。",
      loadWhen: "需要分析未接触过的代码库结构，确定模块边界和精读顺序时读取。",
    }),
    defineReference({
      id: "deep-research-mode",
      source: new URL("./references/deep-research-mode.md", import.meta.url),
      target: "references/deep-research-mode.md",
      title: "deep-research-mode.md",
      summary: "对仓库演进、社区、发布和架构变化做深度研究的扩展流程。",
      loadWhen: "用户要求演进时间线、架构演进、竞品对比或采用决策级研究时读取。",
    }),
    defineReference({
      id: "output-template",
      source: new URL("./references/output-template.md", import.meta.url),
      target: "references/output-template.md",
      title: "output-template.md",
      summary: "轻量仓库分析报告模板。",
      loadWhen: "用户只需要快速仓库体检、采用判断或初步风险评估时读取。",
    }),
    defineReference({
      id: "persist-template",
      source: new URL("./references/persist-template.md", import.meta.url),
      target: "references/persist-template.md",
      title: "persist-template.md",
      summary: "将代码库分析沉淀为可复用 skill 的 SKILL.md 模板。",
      loadWhen: "用户要求保存为 skill、持久化代码库知识或生成可复用认知包时读取。",
    }),
    defineReference({
      id: "wiki-researcher",
      source: new URL("./references/wiki-researcher.md", import.meta.url),
      target: "references/wiki-researcher.md",
      title: "wiki-researcher.md",
      summary: "从 Wiki、文档和外部资料中补充代码库上下文的方法与提示词。",
      loadWhen: "需要从项目 Wiki 或外部文档中补充知识以辅助代码理解时读取。",
    }),
    defineReference({
      id: "workflow",
      source: new URL("./references/workflow.md", import.meta.url),
      target: "references/workflow.md",
      title: "workflow.md",
      summary: "深度代码阅读的整体工作流步骤，包括 A-B-C 三 agent 协作流程。",
      loadWhen: "需要了解或初始化深度代码阅读的完整工作流和 agent 编排时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "report-template",
      source: new URL("./assets/report_template.md", import.meta.url),
      target: "assets/report_template.md",
    }),
  ],
});
