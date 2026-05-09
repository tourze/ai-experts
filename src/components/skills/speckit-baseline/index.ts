import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineSkill,
  defineSkillOutputs,
  defineSkillParameter,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, speckitBaselineBootstrapSpecify, speckitBaselineCheckPrerequisites, speckitBaselineCreateNewFeature, speckitBaselineSetupPlan } from "../../procedures/index";

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
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "确保 `.specify/scripts` 与 `.specify/templates` 存在；若缺失，运行本 skill 自带的 bootstrap procedure。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "解析目标范围：文件路径、目录或 glob；若用户未给范围，先提一个聚焦问题再继续。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: `扫描并读取目标代码，提取：
   - 入口、接口、数据模型、错误处理、用户可见行为`,
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "生成特性短名 `slug`（2-4 词，连字符）。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: `创建或复用目录：\`.specify/features/<slug>/\`。
   - 在该目录写入/更新 \`spec.md\`
   - 在该目录写入 \`checklists/requirements.md\`（完整路径：\`.specify/features/<slug>/checklists/requirements.md\`）
   - 写入 \`.specify/feature.json\` 指向该目录`,
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "模板来源：`.specify/templates/spec-template.md`（由步骤 1 的 bootstrap 拷入）。",
      }),
      defineWorkflowStep({
        id: "step-7",
        label: "将技术细节抽象为需求表达：写“做什么/为什么”，避免“怎么实现”。",
      }),
      defineWorkflowStep({
        id: "step-8",
        label: "对不确定行为最多保留 3 个 `[待澄清]` 标记。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "`feature` 目录",
      "`spec` 文件路径",
      "新增待澄清项",
    ],
  }),
  parameters: [
    defineSkillParameter({ name: "arguments", description: "用户原始输入，如功能名称、需求描述或其他上下文。" }),
  ],
  argumentHint: "[用户输入]",
  procedures: [
    procedureUse(speckitBaselineBootstrapSpecify, {
      label: "初始化 .specify 目录",
      when: ".specify/scripts 或 .specify/templates 缺失时。",
      reason: "自动部署 .specify 目录结构和模板文件，避免手动复制和配置基础设施。",
    }),
    procedureUse(speckitBaselineCheckPrerequisites, {
      label: "前置条件检查",
      when: "需要验证 feature 目录、分支规范、plan.md 是否就绪时。",
      reason: "一次性验证 feature 目录和分支规范，避免在流程中途才发现前置条件未满足。",
    }),
    procedureUse(speckitBaselineCreateNewFeature, {
      label: "创建新 Feature",
      when: "需要为新的功能需求创建 feature 目录结构时。",
      reason: "自动生成 slug 和目录结构，避免手动创建 feature 目录和配置文件。",
    }),
    procedureUse(speckitBaselineSetupPlan, {
      label: "初始化实现计划",
      when: "需要为 feature 创建实现计划 plan.md 时。",
      reason: "快速从模板生成实现计划并校验分支规范，避免手动复制模板和核对分支。",
    }),
  ],
  assets: [
    defineAsset({
      id: "templates",
      source: new URL("./assets/templates/", import.meta.url),
      target: "assets/templates",
    }),
  ],
});
