import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk.js";

export const i18nLocalizationSkill = defineSkill({
  id: "i18n-localization",
  description: "当需要实现多语言、排查硬编码文案、管理翻译资源、设计 locale 结构或处理 RTL 与日期数字格式时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "i18n-checker",
      entry: new URL("./scripts/i18n_checker.mjs", import.meta.url),
      target: "scripts/i18n_checker.mjs",
      runtime: "node",
      bundle: false,
      description: "Script i18n_checker.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for i18n-localization.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
