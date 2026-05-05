import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const fanOperationsSkill = defineSkill({
  id: "fan-operations",
  description: "当用户要提升小红书粉丝互动、评论运营、私信承接、社群留存、粉丝分层或复购转化时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "personal-branding-advanced",
      source: new URL("./references/personal-branding-advanced.md", import.meta.url),
      target: "references/personal-branding-advanced.md",
      title: "personal-branding-advanced.md",
      summary: "Reference material for fan-operations.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "private-domain",
      source: new URL("./references/private-domain.md", import.meta.url),
      target: "references/private-domain.md",
      title: "private-domain.md",
      summary: "Reference material for fan-operations.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for fan-operations.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
