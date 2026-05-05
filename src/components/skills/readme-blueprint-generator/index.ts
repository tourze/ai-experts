import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { markdownMermaidWritingSkill } from "../markdown-mermaid-writing/index";
import { userGuideWritingSkill } from "../user-guide-writing/index";

export const readmeBlueprintGeneratorSkill = defineSkill({
  id: "readme-blueprint-generator",
  fullName: "README 蓝图生成",
  description: "当用户要为仓库生成或重构 README.md 时使用。该技能会先梳理项目定位、技术栈、结构、开发流程和测试方式，再输出开发者可直接使用的 README 骨架。",
  useCases: [
    "仓库没有 README，或 README 已经过时、信息零散、无法指导开发者入门。",
    "用户希望自动扫描项目结构、`.github/copilot` 或 `copilot-instructions.md` 等资料来生成文档骨架。",
    "输出要兼顾“快速上手”和“架构导航”，而不是只列文件树。",
    "如需统一 Markdown 风格，可结合 `markdown-mermaid-writing`。",
  ],
  constraints: [
    "先理解项目是什么、给谁用、怎么跑，再写 README。",
    "README 必须可执行：安装、启动、测试、关键目录都要能落地。",
    "不把猜测写成事实；缺失信息应标成“待补”或“未发现”。",
    "面向开发者的 README 不要混入大量市场宣传话术。",
  ],
  relatedSkills: [
    {
      get id() {
        return markdownMermaidWritingSkill.id;
      },
      reason: "如需统一 Markdown 风格，可结合 `markdown-mermaid-writing`。",
    },
    {
      get id() {
        return userGuideWritingSkill.id;
      },
      reason: "若后续要写面向终端用户的指南，可转给 `user-guide-writing`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
