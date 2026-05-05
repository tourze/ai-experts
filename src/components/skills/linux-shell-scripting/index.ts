import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const linuxShellScriptingSkill = defineSkill({
  id: "linux-shell-scripting",
  description: "当用户要编写 Bash/Zsh 自动化、运维脚本、巡检脚本、备份脚本或命令行工具时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for linux-shell-scripting.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
