import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const goStructsInterfacesSkill = defineSkill({
  id: "go-structs-interfaces",
  description: "当 Go 代码涉及接口设计、结构体组合、embedding、泛型 vs any、receiver 选择、零值可用或 type assertion 时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "composition",
      source: new URL("./references/composition.md", import.meta.url),
      target: "references/composition.md",
      title: "composition.md",
      summary: "Reference material for go-structs-interfaces.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-structs-interfaces.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
