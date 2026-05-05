import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const webmanNamingConventionsSkill = defineSkill({
  id: "webman-naming-conventions",
  description: "当用户要统一或审查 Webman 项目的目录命名、接口后缀、Service 命名或命名空间时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "directory-lowercase",
      source: new URL("./references/directory-lowercase.md", import.meta.url),
      target: "references/directory-lowercase.md",
      title: "directory-lowercase.md",
      summary: "Reference material for webman-naming-conventions.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "interface-naming",
      source: new URL("./references/interface-naming.md", import.meta.url),
      target: "references/interface-naming.md",
      title: "interface-naming.md",
      summary: "Reference material for webman-naming-conventions.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "namespace-directory-mismatch",
      source: new URL("./references/namespace-directory-mismatch.md", import.meta.url),
      target: "references/namespace-directory-mismatch.md",
      title: "namespace-directory-mismatch.md",
      summary: "Reference material for webman-naming-conventions.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "repository-implementation-naming",
      source: new URL("./references/repository-implementation-naming.md", import.meta.url),
      target: "references/repository-implementation-naming.md",
      title: "repository-implementation-naming.md",
      summary: "Reference material for webman-naming-conventions.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "service-naming-pattern",
      source: new URL("./references/service-naming-pattern.md", import.meta.url),
      target: "references/service-naming-pattern.md",
      title: "service-naming-pattern.md",
      summary: "Reference material for webman-naming-conventions.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for webman-naming-conventions.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
