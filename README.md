# ai-experts

面向 Claude Code 与 OpenAI Codex CLI 的本地 AI 能力组件库。

运行时一等对象：

- **Instruction**：稳定会话指令，生成 `dist/claude/CLAUDE.md` 与 `dist/codex/AGENTS.md`。
- **Skill**：可复用工作流，生成 `skills/<skill>/SKILL.md`，可携带 `references/`、`assets/`，并通过 Procedure 暴露可执行能力。
- **Agent**：隔离上下文执行者，可编排多个 skill。
- **Procedure**：可被 skill/agent 调用的本地可执行过程，统一打包进 `procedures.js`。
- **Hook**：生命周期中间件，用于补上下文、阻断、报告和审计。

事实源在 `src/components/`，默认构建产物在 `dist/claude/` 与 `dist/codex/`。仓库根的 `CLAUDE.md` 与 `AGENTS.md` 是指向本文件的 symlink；构建产物里的 `CLAUDE.md` / `AGENTS.md` 由 `src/components/instructions/` 生成。

当前组件规模：335 个 skill、80 个 agent、99 个 hook、120 个 procedure。

## 快速开始

需要 Node.js >= 20.19.0。

```bash
npm install
npm run check:components
npm test
npm run build:components
```

构建后会生成：

```text
dist/
  claude/
    CLAUDE.md
    settings.json
    skills/
    agents/
    hooks/
    procedures.js
    manifest.json
  codex/
    AGENTS.md
    config.toml
    hooks.json
    skills/
    agents/
    hooks/
    procedures.js
    manifest.json
```

`dist/claude/` 直接模拟 `~/.claude/` 的配置面；`dist/codex/` 是可分流安装的 Codex 配置包，其中根配置文件、agents、hooks 和 `procedures.js` 映射到 `~/.codex/`，skills 映射到 `~/.agents/skills/`。不要生成 `dist/claude/.claude/` 或 `dist/codex/.codex/` 这种多余嵌套层。

Codex 的用户级 skills 官方推荐安装到 `~/.agents/skills/`。因此安装器应把 `dist/codex/skills/` 映射到 `~/.agents/skills/`，而不是复制到 `~/.codex/skills/`。

安装器只能逐项复制或 symlink 生成的配置文件、agent 目录、hook 目录和单个 skill 目录；不要把整个 `~/.codex` symlink 到 `dist/codex`，也不要把整个 `~/.agents/skills` symlink 到 `dist/codex/skills`。Codex 会在这些运行时目录写入 `installation_id` 和 `~/.agents/skills/.system/` 等本机状态，运行时状态必须留在用户 home，不能反向污染仓库里的 generated dist。

Codex dist 不输出与 Codex `.system` 内置 skill 同名的用户级 skill，例如 `skill-creator`；这些能力应使用 Codex 系统 skill，避免 selector 出现同名重复项。

`manifest.json` 当前使用 schema 5；`install` 字段是安装器的一等事实源：`rootEntries` 从平台根映射到 `configRoot`，`skillEntries` 从 `skillSourceRoot` 映射到 `skillRoot`，`forbiddenRootEntries` 与 `forbiddenSkillEntries` 分别描述不得覆盖的配置根和 skill 根运行时状态。Claude 的 `skillRoot` 是 `~/.claude/skills`；Codex 的 `configRoot` 是 `~/.codex`、`skillRoot` 是 `~/.agents/skills`，并且 Codex 的 `rootEntries` 不包含 `skills/`。

## 组件源码

```text
src/components/
  sdk.ts
  registry.ts
  registry.generated.ts
  registry.generated.skills.ts
  registry.generated.agents.ts
  instructions/core/
  skills/<skill>/
  agents/<agent>/
  hooks/<hook>/
  procedures/sources/<procedure>/
```

所有组件源码都直接位于 `src/components/skills/`、`src/components/agents/`、`src/components/hooks/`。不要再引入过渡分层。

TS 源码统一使用无后缀相对 import，例如 `../../sdk`，不写 `../../sdk.js`。构建器会在临时编译产物里补回 Node ESM 运行所需的 `.js` 后缀。

## 设计依据

- Claude Code skills: https://code.claude.com/docs/en/skills
- Claude Code subagents: https://code.claude.com/docs/en/sub-agents
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- Claude Code memory: https://code.claude.com/docs/en/memory
- Codex skills: https://developers.openai.com/codex/skills
- Codex subagents: https://developers.openai.com/codex/subagents
- Codex hooks: https://developers.openai.com/codex/hooks
- Codex AGENTS.md: https://developers.openai.com/codex/guides/agents-md

## Skill

Skill 是工作流和能力单元。运行时正文由 `index.ts` 的结构化字段生成；大资料放 `references/`，输出资产放 `assets/`，可执行过程放 `src/components/procedures/sources/` 并由 skill/agent 通过 `procedureUse()` 引用。一级标题由 `fullName` 统一生成到最终 `SKILL.md`，适用场景、核心约束、工作流、输出、检查清单和反模式分别由结构化字段统一生成。

定义示例：

```ts
import {
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineWorkflow,
  defineWorkflowGate,
  defineWorkflowRoute,
  defineWorkflowStep,
  InvocationPolicy,
  KnownTool,
  Platform,
} from "../../sdk";
import { testingPatternsSkill } from "../testing-patterns/index";
import { procedureUse, typescriptTypeSafetyExtractTsErrors } from "../../procedures/index";

export const typescriptTypeSafety = defineSkill({
  id: "typescript-type-safety",
  fullName: "TypeScript Type Safety",
  description: "需要定位 TS 编译错误、清理 any、设计泛型/类型守卫/条件类型，或搭建边界类型合同时使用。",
  useCases: [
    "定位 `tsc --noEmit` 类型错误、清理 `any` 或弱类型字典。",
    "设计泛型、类型守卫、判别联合或外部边界类型合同。",
  ],
  constraints: [
    "先拿到完整编译错误或边界输入样例，再判断要修上游合同还是下游症状。",
    "`any` 只能留在最外层适配器，优先用 `unknown`、类型守卫或 schema 收口。",
  ],
  checklist: [
    "是否先拿到完整错误输出再决定改哪层？",
    "`any` 是否缩回边界层，而不是换成新的宽松断言？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "看到类型错误就用 `any`、宽松断言或 `// @ts-ignore` 压掉。",
      pass: "先确认边界输入和类型合同，把不确定性收口到 `unknown`、类型守卫或 schema。",
    }),
  ],
  relatedSkills: [
    {
      get id() {
        return testingPatternsSkill.id;
      },
      reason: "需要通用测试原则、fixture、mock 或参数化测试方法论时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({ id: "collect", label: "读取完整编译错误和边界输入样例。" }),
      defineWorkflowStep({ id: "fix-contract", label: "先修上游类型合同，再处理下游症状。" }),
    ],
    gates: [
      defineWorkflowGate({
        id: "test-gate",
        skill: testingPatternsSkill.id,
        label: "测试门禁",
        checks: "类型合同变化要说明测试覆盖或无需补测理由。",
      }),
    ],
    routes: [
      defineWorkflowRoute({
        id: "test-route",
        triggers: ["类型修复影响 fixture/mock/参数化测试"],
        skill: testingPatternsSkill.id,
        checks: "补齐最小测试或调整 fixture 合同。",
        output: "测试变更或无需补测说明。",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({ id: "verify", label: "运行 `tsc --noEmit` 和相关测试，报告真实结果。" }),
    ],
  }),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  procedures: [
    procedureUse(typescriptTypeSafetyExtractTsErrors, {
      label: "归组 tsc 错误",
      when: "已有完整 `tsc --noEmit` 输出文件，需要按文件和错误码归组时。",
      reason: "先定位上游类型合同错误，再决定修复顺序。",
      exampleArgs: { args: ["--input", "tsc-output.txt"] },
    }),
  ],
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "Boundary Contract Code Patterns",
      summary: "边界类型合同示例。",
      loadWhen: "需要设计或审查外部边界类型合同时读取。",
    }),
  ],
});
```

规则：

- `sourceDir` 使用 `new URL("./", import.meta.url)`；Procedure `entry`、reference `source`、asset `source` 使用 `new URL("./file", import.meta.url)`。
- 每个 skill 必须声明 `useCases` 与 `constraints`，最终 `SKILL.md` 的 `## 适用场景` 和 `## 核心约束` 只由生成器输出。
- 不再使用 Markdown body 文件；主体内容拆入 `workflow`、`outputs`、`goal`、`checklist`、`antiPatterns`、`relatedSkills`、`parameters` 和 reference/asset/procedure 元数据。
- 检查清单使用 `checklist` 声明为普通字符串数组；构建器会生成 `## 检查清单`，并放在生成的 `## 反模式` 之后。分组清单改写成 `分组：检查项`。Checklist 应优先写成可判定问题并绑定证据要求，例如“是否已运行相关测试，并在最终输出中报告真实结果？”，不要写“运行相关测试”这类命令式待办。
- 每个 skill 必须声明 `workflow: defineWorkflow({ steps/gates/routes/finalSteps })`；节点用 `defineWorkflowStep()` / `defineWorkflowGate()` / `defineWorkflowRoute()`，Skill 与 Agent 共用同一套工作流模型，构建器统一生成 `## 工作流` Mermaid flowchart。
- 反模式使用 `antiPatterns` 声明，每行必须通过 `defineAntiPattern({ fail, pass })` 定义；构建器会生成 `## 反模式` Markdown 表格。大段代码对照放进 `references/`。
- 交叉引用其他 skill 时使用 `relatedSkills` 声明；构建器会生成 `## 相关 Skill`。`relatedSkills` 必须 import 对应 skill definition，并通过 `get id() { return otherSkill.id; }` 延迟读取，避免双向关系造成 ESM 初始化循环；仅单平台可用的关系使用 `platforms` 收窄，不要牺牲另一个平台的输出；不要在 `useCases` 或 `constraints` 里手写 `../other-skill/SKILL.md` 或旧 `plugin:skill` 链接。
- 每个可执行过程必须在 `src/components/procedures/` 登记为 Procedure；skill/agent 通过 `procedureUse(procedureDefinition)` 引用，不手写裸 procedure id。
- reference 必须通过 `defineReference()` 登记，asset 必须通过 `defineAsset()` 登记。
- `evals/` 是源码侧质量验证材料，不是运行时参考资料，不能登记为 reference，也不会复制到 `dist/*/skills/*/references/`。新增 eval 优先写成任务场景，包含 scenario id、触发任务、期望触发的 skill/agent、fixture、成功标准、必须报告的证据和不应出现的行为；模板见 [docs/component-quality-standards.md](docs/component-quality-standards.md)。
- `outputs`、agent `outputFormat` 和 `qualityStandards` 应声明可核查证据字段，例如文件、命令、测试结果、行号、风险、未验证项或复现步骤；不要只写“给出结论”。
- agent 引用 skill 时 import skill definition 并读取 `.id`，不在引用处手写 skill id。
- 低频或高风险流程用 `InvocationPolicy.ExplicitOnly`；构建器会映射到 Claude 与 Codex 的平台配置。
- `InvocationPolicy.ModelOnly` 只用于 Claude-only skill；Codex 只能通过 `allow_implicit_invocation` 控制隐式触发，不能隐藏显式 `$skill` 调用。
- 如果一个 Procedure 只支持部分平台，skill/agent 引用时必须用 `procedureUse(procedureDefinition, { platforms: [...] })` 明确声明引用平台，不能依赖生成器静默过滤。

## Agent

Agent 是隔离上下文执行者，可编排多个 skill。

```ts
import {
  defineAgent,
  defineWorkflow,
  defineWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { debugMethodologySkill } from "../../skills/debug-methodology/index";
import { typescriptTypeSafetySkill } from "../../skills/typescript-type-safety/index";

export const typescriptReviewer = defineAgent({
  id: "typescript-reviewer",
  description: "审查 TypeScript 类型安全、调试证据、行为回归和测试缺口。",
  platforms: [Platform.Claude, Platform.Codex],
  role: "你是资深 TypeScript Reviewer。只读审查类型合同、行为回归和测试缺口。",
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({ id: "inspect", label: "读取改动范围、类型边界和失败证据。" }),
      defineWorkflowStep({ id: "report", label: "按严重度输出发现、证据和修复方向。" }),
    ],
  }),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  skills: [
    { id: typescriptTypeSafetySkill.id, mode: SkillUseMode.Preload, reason: "审查 TS 类型合同。" },
    { id: debugMethodologySkill.id, mode: SkillUseMode.Route, reason: "遇到 flaky 或根因不清时收敛证据。" },
  ],
});
```

Agent 必须声明 `workflow: defineWorkflow({ ... })`。Agent 不再使用 `AGENT.body.md`；正文应拆入 `role`、`workflow`、`outputFormat`、`qualityStandards`、`bashBoundary` 等结构化字段。

Claude 输出为 `dist/claude/agents/<agent>.md`。Codex 输出为 `dist/codex/agents/<agent>.toml`；`role` 与结构化 agent 内容会合并进 `developer_instructions`，skill 编排说明保留在 `developer_instructions`，同时按 `~/.agents/skills/<skill>/SKILL.md` 生成 `[[skills.config]]`。

## Hook

Hook 是生命周期中间件。每个平台只注册生成的 dispatcher，具体 hook 模块由 dispatcher 按事件和 `order` 顺序调用。

Hook 的 `defineHook()` 元数据和 `run()` 实现必须写在同一个 `.ts` 文件中。`entry` 使用 `new URL("./xxx.ts", import.meta.url)` 指向自身。

```ts
import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
  type NormalizedHookPayload,
  type NormalizedHookResult,
} from "../../sdk";

export const generatedDistGuard = defineHook({
  id: "generated-dist-guard",
  description: "阻断对 dist/ 生成产物的直接编辑，并提示回到 src/components 后重新构建。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./generated-dist-guard.ts", import.meta.url),
  order: 20,
});

export async function run(payload: NormalizedHookPayload): Promise<NormalizedHookResult | null> {
  if (payload.event !== HookEvent.PreToolUse) return null;
  const targets = payload.tool?.fileTargets ?? [];
  const generatedTargets = targets.filter((target) =>
    target === "dist" || target.startsWith("dist/") || target.includes("/dist/"),
  );
  if (generatedTargets.length === 0) return null;

  return {
    kind: "deny",
    message: [
      "Generated dist output cannot be edited directly.",
      "Update `src/components/` instead, then run `npm run build:components` to regenerate `dist/claude/` and `dist/codex/`.",
      `Generated target(s): ${generatedTargets.join(", ")}`,
    ].join("\n"),
  };
}
```

Hook handler 使用统一 payload：

```ts
type NormalizedHookPayload = {
  platform: Platform;
  event: HookEvent;
  cwd: string;
  prompt?: string;
  tool?: {
    name?: KnownTool | string;
    input?: unknown;
    response?: unknown;
    fileTargets?: string[];
  };
  raw: unknown;
};
```

返回统一 result：

```ts
type NormalizedHookResult =
  | { kind: "allow" }
  | { kind: "deny"; message: string }
  | { kind: "add-context"; message: string }
  | { kind: "report"; message: string }
  | { kind: "audit"; record: unknown };
```

## 质量门禁

```bash
npm run check:components
npm test
npm run build:components
```

当前门禁覆盖：

- `dist/claude` 生成 335 个 skill、80 个 agent、99 个 hook 和 120 个 procedure；`dist/codex` 生成 333 个 skill、80 个 agent、98 个 hook 和 104 个 procedure（Codex 当前不输出 Claude-only `PreCompact`，也不包含 Claude-only `pdf` skill、PDF procedures、与 `.system` 内置 skill 同名的 `skill-creator` 及其 procedures）；两端都生成 `procedures.js` bundle。
- 代表性 skill 的 `references/`、`assets/` 被复制并可发现；Procedure 调用说明会渲染到相关 `SKILL.md`。
- agent 会生成 Claude Markdown 与 Codex TOML 两种格式。
- hook dispatcher 可真实输出 `additionalContext`，并能阻断直接编辑 `dist/`。
- manifest checksum 可重复生成。

## 维护建议

- 不把多步骤流程写进 Instruction；优先写 skill。
- 不把脚本藏在正文；可执行过程必须登记到 Procedure registry，并由 skill/agent 通过 `procedureUse()` 暴露调用说明。
- 不跨 skill 运行时 import；共享资料在源码层复用，dist 层复制。
- 不让 hook 依赖 CLI 原生多 hook 顺序；统一经过 dispatcher。
- 不假设 Claude 与 Codex payload 等价；payload 差异都放 adapter/dispatcher。
