import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillParameter,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { speckitBaselineSkill } from "../speckit-baseline/index";

export const speckitAnalyzeSkill = defineSkill({
  id: "speckit-analyze",
  fullName: "Speckit Analyze",
  description: "当用户要在任务拆解后审计规格、计划、任务三件套的一致性、重复、冲突或遗漏风险时使用。",
  useCases: [
    "当用户要在任务拆解后审计规格、计划、任务三件套的一致性、重复、冲突或遗漏风险时使用。",
  ],
  constraints: [
    "严格只读，不允许改文件。",
    "结论必须可追溯到文档中的具体段落。",
  ],
  relatedSkills: [
    {
      get id() {
        return speckitBaselineSkill.id;
      },
      reason: "缺少 `.specify/` scripts 或 templates，需要先初始化 Speckit 基线时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: `前置检查：确认 \`.specify/scripts/check-prerequisites.mjs\` 存在。
   - 若不存在，先调用 \`speckit-baseline\` skill 完成 \`.specify/\` 初始化，完成后回到本流程。
   - 不要改跑 bash 版脚本；当前能力的 current feature 定位依赖 Node.js 脚本。`,
      }),
      defineWorkflowStep({
        id: "step-2",
        label: `在仓库根目录运行：
   - \`node .specify/scripts/check-prerequisites.mjs --json --require-tasks --include-tasks\``,
      }),
      defineWorkflowStep({
        id: "step-3",
        label: `从返回结果解析 \`FEATURE_DIR\`，读取：
   - \`spec.md\`
   - \`plan.md\`
   - \`tasks.md\``,
      }),
      defineWorkflowStep({
        id: "step-4",
        label: `按以下维度交叉检查：
   - 需求覆盖：\`spec\` 的功能需求是否被 \`tasks\` 映射
   - 设计一致：\`plan\` 的技术决策是否被 \`tasks\` 执行
   - 约束一致：宪章、NFR、边界条件是否被保留
   - 可测试性：每个关键需求是否可验证`,
      }),
      defineWorkflowStep({
        id: "step-5",
        label: `给出分级问题列表：
   - \`CRITICAL\`：会导致实现方向错误或违反宪章
   - \`HIGH\`：高概率返工
   - \`MEDIUM\`：可实现但质量风险高
   - \`LOW\`：可后续优化`,
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出格式",
    items: [
      "一致性分析报告：Feature 路径、spec/plan/tasks 文档状态。",
      "问题清单：CRITICAL/HIGH/LOW、证据和影响。",
      "修复建议：按阻断程度排序的可选下一步。",
    ],
  }),
  parameters: [
    defineSkillParameter({ name: "arguments", description: "用户原始输入，如功能名称、需求描述或其他上下文。" }),
  ],
  argumentHint: "[用户输入]",
});
