# ai-experts

面向 Claude Code 与 OpenAI Codex CLI 的本地 AI 能力组件库。

运行时一等对象：

- **Instruction**：稳定会话指令，生成 `dist/claude/CLAUDE.md` 与 `dist/codex/AGENTS.md`。
- **Skill**：可复用工作流，生成 `skills/<skill>/SKILL.md`，并可携带 `scripts/`、`references/`、`assets/`。
- **Agent**：隔离上下文执行者，可编排多个 skill。
- **Hook**：生命周期中间件，用于补上下文、阻断、报告和审计。
- **Profile**：组合 instruction、skill、agent 和 hook 的安装画像。

事实源在 `src/components/`，默认构建产物在 `dist/claude/` 与 `dist/codex/`。仓库根的 `CLAUDE.md` 与 `AGENTS.md` 是指向本文件的 symlink；构建产物里的 `CLAUDE.md` / `AGENTS.md` 由 `src/components/instructions/` 生成。

当前组件规模：338 个 skill、80 个 agent、99 个 hook。

## 快速开始

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
    rules/
    manifest.json
  codex/
    AGENTS.md
    config.toml
    hooks.json
    skills/
    agents/
    hooks/
    rules/
    manifest.json
```

`dist/claude/` 直接模拟 `~/.claude/` 的目录结构；`dist/codex/` 直接模拟 Codex 用户配置根需要的结构。不要生成 `dist/claude/.claude/` 或 `dist/codex/.codex/` 这种多余嵌套层。

Codex 的用户级 skills 官方推荐安装到 `~/.agents/skills/`。因此安装器应把 `dist/codex/skills/` 映射到 `~/.agents/skills/`，而不是复制到 `~/.codex/skills/`。

## 组件源码

```text
src/components/
  sdk.ts
  registry.ts
  registry.generated.ts
  instructions/core/
  skills/<skill>/
  agents/<agent>/
  hooks/<hook>/
  profiles/default.ts
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

Skill 是工作流和能力单元。`SKILL.body.md` 只保留主体流程和必要红线，不写一级标题，也不写开头简介段；正文必须从二级标题开始。大资料放 `references/`，脚本放 `scripts/`，输出资产放 `assets/`。一级标题由 `index.ts` 的 `fullName` 统一生成到最终 `SKILL.md`，适用场景、核心约束、检查清单和反模式分别由 `index.ts` 的结构化字段统一生成。

定义示例：

```ts
import { testingPatternsSkill } from "../testing-patterns/index";

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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  scripts: [
    defineSkillScript({
      id: "extract-ts-errors",
      entry: new URL("./scripts/extract-ts-errors.ts", import.meta.url),
      description: "把 tsc 输出按文件和错误码归组。",
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

- `body`、script `entry`、reference `source`、asset `source` 使用 `new URL("./file", import.meta.url)`。
- 每个 skill 必须声明 `useCases` 与 `constraints`，最终 `SKILL.md` 的 `## 适用场景` 和 `## 核心约束` 只由生成器输出；`SKILL.body.md` 不再手写这两个章节。
- `SKILL.body.md` 第一个非空行必须是 `## ...`，不要在正文开头写一句简介；简介类内容放进 `description`、`useCases` 或 `constraints`。
- 检查清单使用 `checklist` 声明为普通字符串数组；构建器会生成 `## 检查清单`，并优先插入到 `## 反模式` / `## 反模式速查` 之前。不要在 `SKILL.body.md` 手写 `## 检查清单`，分组清单改写成 `分组：检查项`。
- 反模式使用 `antiPatterns` 声明，每行必须通过 `defineAntiPattern({ fail, pass })` 定义；构建器会生成 `## 反模式` Markdown 表格。不要在 `SKILL.body.md` 手写 `## 反模式`，大段代码对照放进 `references/`。
- 交叉引用其他 skill 时使用 `relatedSkills` 声明；构建器会生成 `## 相关 Skill`。`relatedSkills` 必须 import 对应 skill definition，并通过 `get id() { return otherSkill.id; }` 延迟读取，避免双向关系造成 ESM 初始化循环；不要在 `SKILL.body.md`、`useCases` 或 `constraints` 里手写 `../other-skill/SKILL.md` 或旧 `plugin:skill` 链接。
- 每个 script 必须通过 `defineSkillScript()` 登记。
- reference 必须通过 `defineReference()` 登记，asset 必须通过 `defineAsset()` 登记。
- `evals/` 是源码侧质量验证材料，不是运行时参考资料，不能登记为 reference，也不会复制到 `dist/*/skills/*/references/`。
- agent/profile 引用 skill 时 import skill definition 并读取 `.id`，不在引用处手写 skill id。
- 低频或高风险流程用 `InvocationPolicy.ExplicitOnly`；构建器会映射到 Claude 与 Codex 的平台配置。

## Agent

Agent 是隔离上下文执行者，可编排多个 skill。

```ts
import { debugMethodology } from "../skills/debug-methodology/index";
import { typescriptTypeSafety } from "../skills/typescript-type-safety/index";

export const typescriptReviewer = defineAgent({
  id: "typescript-reviewer",
  description: "审查 TypeScript 类型安全、调试证据、行为回归和测试缺口。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  skills: [
    { id: typescriptTypeSafety.id, mode: SkillUseMode.Preload, reason: "审查 TS 类型合同。" },
    { id: debugMethodology.id, mode: SkillUseMode.Route, reason: "遇到 flaky 或根因不清时收敛证据。" },
  ],
});
```

Claude 输出为 `dist/claude/agents/<agent>.md`。Codex 输出为 `dist/codex/agents/<agent>.toml`；`role` 与 agent body 会合并进 `developer_instructions`，skill 编排说明保留在 `developer_instructions`，同时按 `~/.agents/skills/<skill>/SKILL.md` 生成 `[[skills.config]]`。

## Hook

Hook 是生命周期中间件。每个平台只注册生成的 dispatcher，具体 hook 模块由 dispatcher 按事件和 `order` 顺序调用。

```ts
export const generatedDistGuard = defineHook({
  id: "generated-dist-guard",
  description: "检测对 dist/ 生成产物的直接编辑，并提示回到 src/components 后重新构建。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./generated-dist-guard.ts", import.meta.url),
  order: 20,
});
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

## Profile

Profile 负责组合能力：

```ts
export const defaultProfile = defineProfile({
  id: "default",
  description: "默认组件画像。",
  instructions: ["core-ai-experts"],
  skills: componentSkills.map((skill) => skill.id),
  agents: componentAgents.map((agent) => agent.id),
  hooks: [
    componentRoutingReminder.id,
    generatedDistGuard.id,
    ...componentHooks.map((hook) => hook.id),
  ],
});
```

## 质量门禁

```bash
npm run check:components
npm test
npm run build:components
```

当前门禁覆盖：

- `dist/claude` 与 `dist/codex` 都生成 338 个 skill、80 个 agent、99 个 hook。
- 代表性 skill 的 `references/`、`assets/`、`scripts/manifest.json` 被复制并可发现。
- agent 会生成 Claude Markdown 与 Codex TOML 两种格式。
- hook dispatcher 可真实输出 `additionalContext`，并能阻断直接编辑 `dist/`。
- manifest checksum 可重复生成。

## 维护建议

- 不把多步骤流程写进 Instruction；优先写 skill。
- 不把脚本藏在正文；脚本必须登记到 skill script registry。
- 不跨 skill 运行时 import；共享资料在源码层复用，dist 层复制。
- 不让 hook 依赖 CLI 原生多 hook 顺序；统一经过 dispatcher。
- 不假设 Claude 与 Codex payload 等价；payload 差异都放 adapter/dispatcher。
