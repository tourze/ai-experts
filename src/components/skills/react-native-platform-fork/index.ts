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

export const reactNativePlatformForkSkill = defineSkill({
  id: "react-native-platform-fork",
  fullName: "跨平台代码组织",
  description: "当用户要组织 React Native 跨平台代码或配置平台分叉时使用。用户提到平台分叉、跨端代码、.native.ts、.tauri.ts、Platform.select 时触发。",
  useCases: [
    "需要为 iOS/Android/Web/Tauri 提供不同实现时。",
    "业务代码中 `Platform.OS` 判断散落各处需收敛时。",
    "配置 Metro 解析自定义平台（Tauri、macOS）时。",
  ],
  constraints: [
    "平台分叉放边界层；业务组件只导入平台无关接口。",
    "`.native.ts` 覆盖 iOS+Android；仅两者真正不同时才拆 `.ios.ts`/`.android.ts`。",
    "共享类型定义放平台无关文件，所有变体导入同一份。",
    "`Platform.select` 用于值选择，不用于控制流。",
    "Tauri 用 `.tauri.ts`，需在 Metro/Vite 配置自定义解析。",
    "不直接 `import './foo.ios'`；通过 `index.ts` 让 bundler 解析。",
    "测试从边界文件导入，不直接导入平台文件。",
  ],
  checklist: [
    "业务组件是否零 `Platform.OS` 判断？",
    "平台变体是否都从 `index.ts` 导出？",
    "自定义平台是否已配置 Metro resolver？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "业务组件散射 Platform.OS",
      pass: "边界文件 + index 导出",
    }),
    defineAntiPattern({
      fail: "iOS/Android 一致也拆",
      pass: "native 兜底",
    }),
    defineAntiPattern({
      fail: "Platform.select 放大段逻辑",
      pass: "Platform.select 只选值",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认平台差异类型：样式值、API 能力、组件实现、导航流程、原生模块或完整平台目标。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "小型值差异读取 `platform-select-values`，用 `Platform.select` 收敛到样式/配置层。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "组件或 API 差异读取 `boundary-file-pattern` 和 `adapter-interface`，把分叉放到边界文件或接口适配层。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "自定义平台后缀或非 iOS/Android 目标读取 `metro-custom-platforms`，确认 resolver 扩展顺序。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "避免在业务组件内部散落 `Platform.OS`，并保持类型合同一致。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "输出分叉边界、共享代码、平台专属文件和验证矩阵。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "平台差异分类和分叉策略选择。",
      "边界文件、Platform.select、适配器接口或 Metro 自定义平台方案。",
      "共享代码与平台专属代码清单。",
      "类型合同、测试矩阵和维护风险。",
    ],
  }),
  references: [
    defineReference({
      id: "adapter-interface",
      source: new URL("./references/adapter-interface.md", import.meta.url),
      target: "references/adapter-interface.md",
      title: "adapter-interface.md",
      summary: "适配器接口的具体实现方式与跨平台抽象层示例。",
      loadWhen: "需要定义或审查平台适配器接口，或决定如何封装平台差异时读取。",
    }),
    defineReference({
      id: "boundary-file-pattern",
      source: new URL("./references/boundary-file-pattern.md", import.meta.url),
      target: "references/boundary-file-pattern.md",
      title: "boundary-file-pattern.md",
      summary: "边界文件模式的组织方式与 index.ts 导出约定。",
      loadWhen: "需要设计或审查平台变体文件的目录结构和导出策略时读取。",
    }),
    defineReference({
      id: "metro-custom-platforms",
      source: new URL("./references/metro-custom-platforms.md", import.meta.url),
      target: "references/metro-custom-platforms.md",
      title: "metro-custom-platforms.md",
      summary: "Metro bundler 自定义平台解析配置方法与 resolve 扩展名顺序。",
      loadWhen: "需要为 Tauri、macOS 等自定义平台配置 Metro 或 Vite 解析器时读取。",
    }),
    defineReference({
      id: "platform-select-values",
      source: new URL("./references/platform-select-values.md", import.meta.url),
      target: "references/platform-select-values.md",
      title: "platform-select-values.md",
      summary: "Platform.select 的值选择用法与不当控制流用例的对比。",
      loadWhen: "需要决定是否用 Platform.select 还是拆平台文件时读取。",
    }),
    defineReference({
      id: "react-native-macos",
      source: new URL("./references/react-native-macos.md", import.meta.url),
      target: "references/react-native-macos.md",
      title: "react-native-macos.md",
      summary: "React Native macOS 平台的差异点与专用配置方法。",
      loadWhen: "需要支持 macOS 平台分叉或在 RN macOS 上处理平台差异时读取。",
    }),
  ],
});
