import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
  checklist: [
    "是否明确了项目定位、主要能力和运行前提。",
    "是否给出了可复制执行的安装、启动、测试命令。",
    "是否解释了关键目录，而不是只贴文件树。",
    "是否写清楚了贡献方式、环境变量和常见问题入口。",
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
  antiPatterns: [
    defineAntiPattern({
      fail: "只有营销话术：没有安装/启动/测试命令，新人 clone 完无从下手。",
      pass: "可复制执行的指令：npm install cp .env.example .env # 配置 DATABASE_URL npm run migrate npm run dev # http://localhost:3000 npm test # 单元 npm run test:e2e # E2E",
    }),
    defineAntiPattern({
      fail: "编造技术栈：实际只用了其中 2 个。",
      pass: "读代码定位事实：只列真实依赖，缺失信息标\"待补\"。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先扫描 README、copilot instructions、包管理配置、Makefile、CI 配置和关键目录，确认项目真实运行方式。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "用 `rg --files` 和对包管理文件的脚本/测试/build/start 字段检查，避免把猜测写成事实。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按项目简介、技术栈、快速开始、项目结构、开发流程、测试与质量保障组织蓝图。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "缺失信息标为待补；面向开发者写可执行命令，不混入营销式描述。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "README 骨架或重构稿，覆盖项目简介、技术栈、快速开始、结构、开发流程和测试质量入口。",
      "可复制执行的安装、启动、测试、lint/build 命令和环境变量说明。",
      "未发现或待确认的事实列表，以及需要用户补充的项目上下文。",
    ],
  }),
});
