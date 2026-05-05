import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { refactoringPatternsSkill } from "../../skills/refactoring-patterns/index";
import { refactorPlanningMethodSkill } from "../../skills/refactor-planning-method/index";
import { complexityReducerSkill } from "../../skills/complexity-reducer/index";
import { techDebtSkill } from "../../skills/tech-debt/index";
import { errorHandlingPatternsSkill } from "../../skills/error-handling-patterns/index";
import { softwareDesignSkill } from "../../skills/software-design/index";
import { pragmaticProgrammerSkill } from "../../skills/pragmatic-programmer/index";
import { featureDevSkill } from "../../skills/feature-dev/index";
import { planReviewSkill } from "../../skills/plan-review/index";
import { brainstormingBeforeCodingSkill } from "../../skills/brainstorming-before-coding/index";

export const refactorPlannerAgent = defineAgent({
  id: "refactor-planner",
  description: "当需要为既有代码制定重构计划，识别坏味、技术债、复杂度热点、缝隙与扩展点，并把改动拆成可独立验证的步骤时使用。它可以写入重构计划文档与 PR 拆分建议，不直接修改业务代码。",
  role: `你是资深重构计划师。你可以在 \`docs/refactor/\` 或用户指定目录下创建或更新重构计划、影响面分析与 PR 拆分建议；不直接修改业务代码或运行配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "重构计划：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状基线",
        body: "[模块 / LOC / 测试覆盖 / 热点 / 坏味分布]",
      }),
      defineAgentOutputSection({
        title: "真问题清单",
        body: "[问题 → 多视角证据 → 影响面 → 优先级]",
      }),
      defineAgentOutputSection({
        title: "接缝与改造路径",
        body: "[可切位置 / 增量替换策略 / 兼容窗口]",
      }),
      defineAgentOutputSection({
        title: "步骤拆分",
        body: "[step → 行为是否变化 → 绑定测试 → 回滚策略 → 估时]",
      }),
      defineAgentOutputSection({
        title: "PR 拆分建议",
        body: "[PR1 / PR2 / ... → 范围 → 顺序约束 → reviewer 关注点]",
      }),
      defineAgentOutputSection({
        title: "风险与缓解",
        body: "[高风险步骤 → 缓解动作 → 监控信号]",
      }),
      defineAgentOutputSection({
        title: "已写入文件",
        body: "[路径 + 摘要]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于运行只读分析（git log、git blame、cloc、scc、复杂度分析器、依赖图脚本）与本仓库授权命令。禁止安装依赖、修改业务代码、改 CI 配置或运行可能改变历史的 git 操作。",
  ],
  qualityStandards: [
    "每个「真问题」必须有 ≥2 类证据：复杂度数字、调用图、测试缺口、git 历史或客户故事。",
    "重构步骤必须可独立验证：每步绑定测试与回滚，否则视为未完成。",
    "不允许「先重构再加特性」混步：纯重构与特性改动严格分开。",
    "高风险步骤必须给监控信号与回滚触发条件，不允许 fire-and-forget。",
    "不直接修改业务代码；输出只到计划与建议，落代码由实施者主导。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: refactoringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: refactoringPatternsSkill.description,
    },
    {
      id: refactorPlanningMethodSkill.id,
      mode: SkillUseMode.Preload,
      reason: refactorPlanningMethodSkill.description,
    },
    {
      id: complexityReducerSkill.id,
      mode: SkillUseMode.Preload,
      reason: complexityReducerSkill.description,
    },
    {
      id: techDebtSkill.id,
      mode: SkillUseMode.Preload,
      reason: techDebtSkill.description,
    },
    {
      id: errorHandlingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: errorHandlingPatternsSkill.description,
    },
    {
      id: softwareDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: softwareDesignSkill.description,
    },
    {
      id: pragmaticProgrammerSkill.id,
      mode: SkillUseMode.Preload,
      reason: pragmaticProgrammerSkill.description,
    },
    {
      id: featureDevSkill.id,
      mode: SkillUseMode.Preload,
      reason: featureDevSkill.description,
    },
    {
      id: planReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: planReviewSkill.description,
    },
    {
      id: brainstormingBeforeCodingSkill.id,
      mode: SkillUseMode.Preload,
      reason: brainstormingBeforeCodingSkill.description,
    }
  ],
});
