import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const shadcnUiSkill = defineSkill({
  id: "shadcn-ui",
  fullName: "shadcn/ui 集成",
  description: "当任务涉及 shadcn/ui 组件集成、components.json 配置、Registry 或 Radix/Base UI 迁移时使用。",
  useCases: [
    "初始化或接管一个使用 shadcn/ui 的前端项目。",
    "需要添加 Button、Dialog、Form、Table 等组件。",
    "需要从 Radix / Base UI、Tailwind v3 / v4、Registry 迁移或排障。",
    "需要核对 `components.json`、别名、`cn()` 工具和全局样式是否完整。",
  ],
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
});
