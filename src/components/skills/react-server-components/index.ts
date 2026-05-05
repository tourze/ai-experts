import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const reactServerComponentsSkill = defineSkill({
  id: "react-server-components",
  fullName: "React Server Components",
  description: "当用户需要实现 RSC 架构、服务端组件边界、Server Actions、streaming 渲染、客户端组件拆分、RSC 性能优化、数据瀑布并行化、React.cache 去重、序列化开销治理或表单提交时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for react-server-components.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for react-server-components.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
