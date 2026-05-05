import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
    "如果当前还在收集素材和结构，可先用 `doc-coauthoring`。",
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
  ],
  relatedSkills: [
    {
      get id() {
        return docCoauthoringSkill.id;
      },
      reason: "如果当前还在收集素材和结构，可先用 `doc-coauthoring`。",
    },
    {
      get id() {
        return readmeBlueprintGeneratorSkill.id;
      },
      reason: "若还需要同步更新仓库说明，可结合 `readme-blueprint-generator`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
