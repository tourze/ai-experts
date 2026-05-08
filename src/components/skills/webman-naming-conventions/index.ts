import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const webmanNamingConventionsSkill = defineSkill({
  id: "webman-naming-conventions",
  fullName: "Webman Naming Conventions",
  description: "当用户要统一或审查 Webman 项目的目录命名、接口后缀、Service 命名或命名空间时使用。",
  useCases: [
    "统一目录命名、接口后缀、命名空间。",
    "审查 Service/Repository 命名。",
    "修复命名空间与目录不一致。",
  ],
  constraints: [
    "目录小写，多词下划线。见 [directory-lowercase](references/directory-lowercase.md)。",
    "接口 `Interface` 后缀。见 [interface-naming](references/interface-naming.md)。",
    "Service `VerbNounService`。见 [service-naming-pattern](references/service-naming-pattern.md)。",
    "命名空间与目录一致。见 [namespace-directory-mismatch](references/namespace-directory-mismatch.md)。",
    "Repository 实现加技术前缀。见 [repository-implementation-naming](references/repository-implementation-naming.md)。",
  ],
  checklist: [
    "目录全小写，无驼峰",
    "接口用 `Interface` 后缀",
    "Service 命名表达动作",
    "命名空间与目录路径一致",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "大小写混用",
      pass: "全小写下划线",
    }),
    defineAntiPattern({
      fail: "接口无后缀",
      pass: "Interface 后缀",
    }),
    defineAntiPattern({
      fail: "命名空间与目录漂移",
      pass: "严格映射",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认要审查的目录、命名空间、接口、Service、Repository 和自动加载规则。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "目录规则读取 `directory-lowercase`，统一小写和多词下划线。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "接口规则读取 `interface-naming`，统一 `Interface` 后缀。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "Service 命名读取 `service-naming-pattern`，使用表达动作的 `VerbNounService`。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "命名空间与目录不一致读取 `namespace-directory-mismatch`；Repository 实现读取 `repository-implementation-naming`。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "输出命名问题清单、修改建议、PSR-4 风险和分阶段重命名计划。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目录、命名空间、接口、Service、Repository 命名审查表。",
      "不一致项、违反规则和 PSR-4 自动加载风险。",
      "目标命名方案和重命名顺序。",
      "需要同步调整的引用、配置和测试范围。",
    ],
  }),
  references: [
    defineReference({
      id: "directory-lowercase",
      source: new URL("./references/directory-lowercase.md", import.meta.url),
      target: "references/directory-lowercase.md",
      title: "directory-lowercase.md",
      summary: "Webman 目录命名规范，全小写多词下划线风格的具体规则与示例。",
      loadWhen: "需要审查或统一项目的目录命名风格时读取。",
    }),
    defineReference({
      id: "interface-naming",
      source: new URL("./references/interface-naming.md", import.meta.url),
      target: "references/interface-naming.md",
      title: "interface-naming.md",
      summary: "Webman 接口命名规范，Interface 后缀的使用规则与约定。",
      loadWhen: "需要检查接口命名是否符合项目约定时读取。",
    }),
    defineReference({
      id: "namespace-directory-mismatch",
      source: new URL("./references/namespace-directory-mismatch.md", import.meta.url),
      target: "references/namespace-directory-mismatch.md",
      title: "namespace-directory-mismatch.md",
      summary: "命名空间与目录路径不一致的问题检测和修复方法。",
      loadWhen: "需要排查 PSR-4 加载失败或修复命名空间与目录漂移时读取。",
    }),
    defineReference({
      id: "repository-implementation-naming",
      source: new URL("./references/repository-implementation-naming.md", import.meta.url),
      target: "references/repository-implementation-naming.md",
      title: "repository-implementation-naming.md",
      summary: "Webman Repository 实现类的命名规范，包括技术前缀的使用规则。",
      loadWhen: "需要审查 Repository 实现命名或统一数据访问层命名风格时读取。",
    }),
    defineReference({
      id: "service-naming-pattern",
      source: new URL("./references/service-naming-pattern.md", import.meta.url),
      target: "references/service-naming-pattern.md",
      title: "service-naming-pattern.md",
      summary: "Webman Service 层的 VerbNounService 命名模式与最佳实践。",
      loadWhen: "需要审查或统一 Service 类命名风格时读取。",
    }),
  ],
});
