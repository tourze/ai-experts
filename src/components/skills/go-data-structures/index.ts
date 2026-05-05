import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goDataStructuresSkill = defineSkill({
  id: "go-data-structures",
  description: "当需要选择、优化或理解 Go 数据结构内部机制：slice 容量增长、map 哈希桶、泛型容器、container/*、unsafe.Pointer、copy 语义时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "map-internals",
      source: new URL("./references/map-internals.md", import.meta.url),
      target: "references/map-internals.md",
      title: "map-internals.md",
      summary: "Reference material for go-data-structures.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "slice-internals",
      source: new URL("./references/slice-internals.md", import.meta.url),
      target: "references/slice-internals.md",
      title: "slice-internals.md",
      summary: "Reference material for go-data-structures.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-data-structures.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
