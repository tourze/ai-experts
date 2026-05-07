import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillParameter,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, speckitBaselineBootstrapSpecify, speckitBaselineCheckPrerequisites, speckitBaselineCommon, speckitBaselineCreateNewFeature, speckitBaselineSetupPlan } from "../../procedures/index";

export const speckitBaselineSkill = defineSkill({
  id: "speckit-baseline",
  fullName: "Speckit Baseline",
  description: "当用户要从现有代码反向抽取需求、建立初始 spec.md 或启动 legacy feature baseline 时使用。",
  useCases: [
    "当用户要从现有代码反向抽取需求、建立初始 spec.md 或启动 legacy feature baseline 时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
    "默认在当前分支写入规格；禁止执行 `git checkout -b`、`git switch -c` 或 `node .specify/scripts/create-new-feature.mjs`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "确保 `.specify/scripts` 与 `.specify/templates` 存在；若缺失，运行本 skill 自带的 bootstrap procedure。",
      "解析目标范围：文件路径、目录或 glob；若用户未给范围，先提一个聚焦问题再继续。",
      `扫描并读取目标代码，提取：
   - 入口、接口、数据模型、错误处理、用户可见行为`,
      "生成特性短名 `slug`（2-4 词，连字符）。",
      `创建或复用目录：\`.specify/features/<slug>/\`。
   - 在该目录写入/更新 \`spec.md\`
   - 在该目录写入 \`checklists/requirements.md\`（完整路径：\`.specify/features/<slug>/checklists/requirements.md\`）
   - 写入 \`.specify/feature.json\` 指向该目录`,
      "模板来源：`.specify/templates/spec-template.md`（由步骤 1 的 bootstrap 拷入）。",
      "将技术细节抽象为需求表达：写“做什么/为什么”，避免“怎么实现”。",
      "对不确定行为最多保留 3 个 `[待澄清]` 标记。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "`feature` 目录",
      "`spec` 文件路径",
      "新增待澄清项",
    ],
  }),
  tools: [],
  parameters: [
    defineSkillParameter({ name: "arguments", description: "用户原始输入，如功能名称、需求描述或其他上下文。" }),
  ],
  argumentHint: "[用户输入]",
  procedures: [
    procedureUse(speckitBaselineBootstrapSpecify),
    procedureUse(speckitBaselineCheckPrerequisites),
    procedureUse(speckitBaselineCommon),
    procedureUse(speckitBaselineCreateNewFeature),
    procedureUse(speckitBaselineSetupPlan),
  ],
});
