import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { docCoauthoringSkill } from "../doc-coauthoring/index";
import { readmeBlueprintGeneratorSkill } from "../readme-blueprint-generator/index";

export const userGuideWritingSkill = defineSkill({
  id: "user-guide-writing",
  fullName: "用户指南写作",
  description: "当用户要编写面向最终用户的使用指南、教程、上手手册、FAQ 或帮助中心内容时使用。该技能强调任务导向、截图规划和低门槛表达。",
  useCases: [
    "文档读者是终端用户、业务用户、客户支持对象，而不是研发同事。",
    "需要写 onboarding、操作手册、教程、常见问题、故障排查或培训资料。",
    "用户希望内容“能照着做”，而不是高层概述。",
  ],
  constraints: [
    "以任务为单位组织内容，例如“如何导出数据”，不要按内部模块堆目录。",
    "用用户语言，不用系统实现语言；一步只做一件事。",
    "只有在必要时才插图，并说明截图位置、状态和成功标准。",
    "指南必须标明前置条件、结果预期和异常情况的处理方式。",
  ],
  checklist: [
    "是否明确了用户画像、前置条件和最终目标。",
    "是否每个步骤都可执行，且有成功标准或结果说明。",
    "是否把异常情况、权限限制和常见错误单独列出。",
    "是否避免使用内部术语、缩写和实现细节。",
    "是否标注了界面状态、截图位置、验证结果和仍需业务方确认的未验证项？",
  ],
  relatedSkills: [
    {
      get skill() {
        return docCoauthoringSkill;
      },
      reason: "如果当前还在收集素材和结构，可先用 `doc-coauthoring`。",
    },
    {
      get skill() {
        return readmeBlueprintGeneratorSkill;
      },
      reason: "若还需要同步更新仓库说明，可结合 `readme-blueprint-generator`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "内部术语 + 无操作",
      pass: "任务导向 + 可执行",
    }),
    defineAntiPattern({
      fail: "省略前置条件",
      pass: "前置条件前置",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认目标读者、文档类型、关键任务、前置条件、权限限制和成功标准。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按任务组织章节，使用开始前准备、步骤、常见问题、失败时怎么办的顺序；一步只做一件事。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "必要截图只放在关键分叉或状态确认处，并说明截图位置、状态和成功标准。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "交付前检查用户语言、异常路径、权限限制和内部术语，避免把实现细节暴露给终端用户。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "面向终端用户的指南结构或完整稿，包含开始前准备、任务步骤、成功标准、FAQ 和故障处理。",
      "关键任务清单、截图规划、权限/前置条件、异常情况和可核查界面证据。",
      "需要产品、客服或业务方补充确认的术语、界面状态、验证结果、文件位置和未验证项。",
    ],
  }),
});
