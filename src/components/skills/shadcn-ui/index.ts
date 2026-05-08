import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, shadcnUiVerifySetup } from "../../procedures/index";

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
    "关键示例可对照 `references/examples/` 与 `references/resources/` 落地。",
  ],
  relatedSkills: [
    {
      get id() {
        return frontendDesignReviewSkill.id;
      },
      reason: "组件接入后需要复核视觉一致性、交互状态或响应式质量时联动。",
    },
    {
      get id() {
        return designSystemPatternsSkill.id;
      },
      reason: "需要把 shadcn 默认 token 映射到既有品牌、主题和设计系统时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "手抄半套源码",
      pass: "CLI 安装",
    }),
    defineAntiPattern({
      fail: "保留 shadcn 默认视觉",
      pass: "映射到项目 token",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先检查 `components.json`、路径别名、`cn()`、Tailwind v3/v4 配置、全局样式和包管理器状态。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "优先用 shadcn CLI 或受控模板添加组件，不手抄半套源码；需要核对时调用 `shadcn-ui-verify-setup`。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "把 Button、Dialog、Form、Table、Toast 等组件映射到项目 token、字体、spacing、主题和交互状态。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "复杂示例优先对照 `references/examples/`、`references/resources/` 和 README；迁移或排障时区分 Radix/Base UI、Tailwind 版本和 Registry 来源。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "shadcn/ui 接入状态：components.json、cn、Tailwind、别名、全局样式和依赖。",
      "组件添加/迁移命令、项目 token 映射、复杂组件依赖和验证结果。",
      "需要设计系统或前端视觉复核的遗留问题。",
    ],
  }),
  tools: [
    { kind: "mcp", server: "shadcn" },
    KnownTool.Read,
    KnownTool.Write,
    KnownTool.Bash,
    KnownTool.WebFetch,
  ],
  procedures: [
    procedureUse(shadcnUiVerifySetup),
  ],
  references: [
    defineReference({
      id: "examples",
      source: new URL("./references/examples/", import.meta.url),
      target: "references/examples",
      title: "shadcn/ui examples",
      summary: "表单、数据表和认证布局的 shadcn/ui 示例实现。",
      loadWhen: "需要落地复杂 shadcn/ui 组件组合或对照代码样例时读取。",
    }),
    defineReference({
      id: "resources",
      source: new URL("./references/resources/", import.meta.url),
      target: "references/resources",
      title: "shadcn/ui resources",
      summary: "项目初始化、组件目录、定制主题和迁移指南。",
      loadWhen: "需要配置 shadcn/ui、迁移组件库或定制设计 token 时读取。",
    }),
  ],
});
