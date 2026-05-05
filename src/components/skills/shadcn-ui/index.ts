import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
import { designSystemPatternsSkill } from "../design-system-patterns/index";
import { frontendDesignReviewSkill } from "../frontend-design-review/index";

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
  constraints: [
    "shadcn/ui 不是运行时组件库，而是把组件源码拷进你的仓库；后续维护责任在项目内。",
    "优先用 CLI 安装组件，不要手抄半套源码。",
    "组件接入前先确认项目的 Tailwind、别名、`components.json` 和 `cn()` 是否可用。",
    "有设计系统时，先映射现有 token、字体和 spacing，不要把 shadcn 默认值原样散落全项目。",
    "文档、脚本和示例统一按当前项目形态工作：Tailwind v4 可仅靠 CSS-first 配置，不强制 `tailwind.config.*`。",
  ],
  checklist: [
    "`components.json`、路径别名和 `cn()` 工具都已就位。",
    "Tailwind v3/v4 配置与项目实际版本一致。",
    "新增组件通过 CLI 或受控模板引入，不是随手复制旧代码。",
    "组件样式已映射到项目 token、主题和字体体系。",
    "表单、弹层、表格等复杂组件的依赖都已安装。",
    "关键示例可对照 `examples/` 与 `resources/` 落地。",
  ],
  relatedSkills: [
    {
      get id() {
        return designSystemPatternsSkill.id;
      },
      label: "tailwind-design-system",
      reason: "`tailwind-design-system`。",
    },
    {
      get id() {
        return frontendDesignReviewSkill.id;
      },
      reason: "`frontend-design-review`。",
    },
    {
      get id() {
        return designSystemPatternsSkill.id;
      },
      reason: "`design-system-patterns`",
    },
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
