import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const docCoauthoringSkill = defineSkill({
  id: "doc-coauthoring",
  fullName: "文档共创",
  description: "当用户要协作撰写文档、方案、技术设计、决策记录或其他结构化材料时使用。",
  useCases: [
    "用户手里有零散素材，需要共同整理成可读、可评审、可交付的文档。",
    "文档类型可以是技术设计、项目方案、研究备忘录、培训材料、用户指南。",
    "用户需要“边问边补、边写边校”，而不是一次性生成完稿。",
    "若文档偏正式提案，可接续 [proposal-review](../proposal-writer/SKILL.md) 或 [proposal-writer](../proposal-writer/SKILL.md)。",
  ],
  constraints: [
    "先收集上下文和读者信息，再决定结构；不要盲写。",
    "每一轮只推进一个明确目标：补背景、定结构、写章节、做验收。",
    "对缺失信息要显式标注“待确认”，但不要把未确认内容包装成事实。",
    "交付前必须做一次读者视角检查：读者是谁、读完要做什么、还缺什么。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
