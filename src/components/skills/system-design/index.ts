import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const systemDesignSkill = defineSkill({
  id: "system-design",
  fullName: "system-design",
  description: "在需要设计系统、服务、存储、接口和边界时使用；强调需求澄清、高层方案、关键细节、可靠性和权衡。",
  useCases: [
    "适合系统设计题、平台方案、服务拆分、API 设计、数据模型和可靠性策略。",
    "适合把业务目标转成组件、数据流、协议、状态和扩展路线。",
    "交叉引用：数据系统细节配合 [references/ddia-systems.md](references/ddia-systems.md)；计划化落地配合 `task-decomposer`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ddia-systems",
      source: new URL("./references/ddia-systems.md", import.meta.url),
      target: "references/ddia-systems.md",
      title: "ddia-systems.md",
      summary: "Reference material for system-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
