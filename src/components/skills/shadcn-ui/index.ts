import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const shadcnUiSkill = defineSkill({
  id: "shadcn-ui",
  fullName: "shadcn/ui 集成",
  description: "当任务涉及 shadcn/ui 组件集成、components.json 配置、Registry 或 Radix/Base UI 迁移时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: ["\"shadcn*:*\"", "\"mcp_shadcn*\"", "\"Read\"", "\"Write\"", "\"Bash\"", "\"web_fetch\""],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "verify-setup",
      entry: new URL("./scripts/verify-setup.mjs", import.meta.url),
      target: "scripts/verify-setup.mjs",
      runtime: "node",
      bundle: false,
      description: "Script verify-setup.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for shadcn-ui.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
