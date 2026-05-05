import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const nextjsDeveloperSkill = defineSkill({
  id: "nextjs-developer",
  fullName: "Next.js Developer",
  description: "当用户提到 Next.js、App Router、Server Components、Server Actions、Route Handlers 或 Vercel 部署时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "app-router",
      source: new URL("./references/app-router.md", import.meta.url),
      target: "references/app-router.md",
      title: "app-router.md",
      summary: "Reference material for nextjs-developer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "data-fetching",
      source: new URL("./references/data-fetching.md", import.meta.url),
      target: "references/data-fetching.md",
      title: "data-fetching.md",
      summary: "Reference material for nextjs-developer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "deployment",
      source: new URL("./references/deployment.md", import.meta.url),
      target: "references/deployment.md",
      title: "deployment.md",
      summary: "Reference material for nextjs-developer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "server-actions",
      source: new URL("./references/server-actions.md", import.meta.url),
      target: "references/server-actions.md",
      title: "server-actions.md",
      summary: "Reference material for nextjs-developer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "server-components",
      source: new URL("./references/server-components.md", import.meta.url),
      target: "references/server-components.md",
      title: "server-components.md",
      summary: "Reference material for nextjs-developer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for nextjs-developer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
