import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { reactNativeDesignSkill } from "../../skills/react-native-design/index";
import { reactNativeJsPerformanceSkill } from "../../skills/react-native-js-performance/index";
import { reactNativePlatformForkSkill } from "../../skills/react-native-platform-fork/index";
import { reactNativeTurbomoduleSkill } from "../../skills/react-native-turbomodule/index";
import { reactNativeMetroConfigSkill } from "../../skills/react-native-metro-config/index";
import { detoxMobileTestSkill } from "../../skills/detox-mobile-test/index";

export const reactNativeEngineerAgent = defineAgent({
  id: "react-native-engineer",
  description: "当需要端到端设计或实现 React Native 移动应用时使用——覆盖项目架构、导航设计、列表性能、TurboModule 原生模块、Metro 构建配置、平台分叉策略与 Detox E2E 测试。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 React Native 工程师。你可以读取项目源码、package.json 与原生配置，设计方案并在用户指定目录下编写或修改 JavaScript/TypeScript 代码、原生模块、测试与设计文档；不修改生产密钥、签名证书或发布配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于：`npx react-native start`、`npx react-native build`、`npx detox test`、`npx metro bundle`、`npm test`、`yarn test`、git 操作。禁止：修改生产配置、发布到应用商店、连接生产后端不经确认。",
  ],
  qualityStandards: [
    "导航层级清晰，deep link 可达每个屏幕，返回栈行为符合平台预期。",
    "FlatList/FlashList 有稳定的 key、合理的 windowSize 和 getItemLayout 配置。",
    "平台分叉粒度适度：业务逻辑共享，UI 层按平台适配；避免 Platform.OS 散落到处。",
    "TurboModule 接口通过 codegen 生成，不手写原生注册代码。",
    "Metro 构建在 CI 中可复现，bundle 体积有基线对比。",
    "关键用户流程有 Detox E2E 覆盖，CI 中设备配置稳定可复现。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: reactNativeDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: reactNativeDesignSkill.description,
    },
    {
      id: reactNativeJsPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: reactNativeJsPerformanceSkill.description,
    },
    {
      id: reactNativePlatformForkSkill.id,
      mode: SkillUseMode.Preload,
      reason: reactNativePlatformForkSkill.description,
    },
    {
      id: reactNativeTurbomoduleSkill.id,
      mode: SkillUseMode.Preload,
      reason: reactNativeTurbomoduleSkill.description,
    },
    {
      id: reactNativeMetroConfigSkill.id,
      mode: SkillUseMode.Preload,
      reason: reactNativeMetroConfigSkill.description,
    },
    {
      id: detoxMobileTestSkill.id,
      mode: SkillUseMode.Preload,
      reason: detoxMobileTestSkill.description,
    }
  ],
});
