import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillParameter,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const speckitCheckerSkill = defineSkill({
  id: "speckit-checker",
  fullName: "Speckit Checker",
  description: "当用户要检测项目技术栈并运行可用静态检查、lint、typecheck 或测试前质量门禁时使用。",
  useCases: [
    "当用户要检测项目技术栈并运行可用静态检查、lint、typecheck 或测试前质量门禁时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "检测项目配置：`package.json`、`pyproject.toml`、`go.mod`、`Cargo.toml`、`pom.xml`。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "检测可用检查器：`eslint`、`ruff`、`mypy`、`golangci-lint`、`clippy` 等。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "仅执行当前环境可运行的命令，避免伪失败。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: `统一归并结果：
   - 语法错误
   - 类型错误
   - 规范问题
   - 安全告警`,
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "产出修复优先级（P0/P1/P2）与建议顺序。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出模板",
    items: [
      "静态检查汇总：检查器列表、成功/失败状态和关键输出。",
      "问题分级：P0/P1/P2、位置、证据和建议修复顺序。",
    ],
  }),
  parameters: [
    defineSkillParameter({ name: "arguments", description: "用户原始输入，如功能名称、需求描述或其他上下文。" }),
  ],
  argumentHint: "[用户输入]",
});
