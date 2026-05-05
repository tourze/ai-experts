import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const dataAnalysisSkill = defineSkill({
  id: "data-analysis",
  description: "当用户上传或指定 .xlsx、.csv 等表格文件，需要分析数据并给出结论时使用。",
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
      id: "analyze",
      entry: new URL("./scripts/analyze.mjs", import.meta.url),
      target: "scripts/analyze.mjs",
      runtime: "node",
      bundle: false,
      description: "Script analyze.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for data-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
