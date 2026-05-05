import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index.js";
import { reactNativeDesignSkill } from "../../skills/react-native-design/index.js";
import { reactNativeJsPerformanceSkill } from "../../skills/react-native-js-performance/index.js";
import { reactNativePlatformForkSkill } from "../../skills/react-native-platform-fork/index.js";
import { reactNativeTurbomoduleSkill } from "../../skills/react-native-turbomodule/index.js";
import { reactNativeMetroConfigSkill } from "../../skills/react-native-metro-config/index.js";
import { detoxMobileTestSkill } from "../../skills/detox-mobile-test/index.js";

export const reactNativeEngineerAgent = defineAgent({
  id: "react-native-engineer",
  description: "当需要端到端设计或实现 React Native 移动应用时使用——覆盖项目架构、导航设计、列表性能、TurboModule 原生模块、Metro 构建配置、平台分叉策略与 Detox E2E 测试。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: reactNativeDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: reactNativeJsPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: reactNativePlatformForkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: reactNativeTurbomoduleSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: reactNativeMetroConfigSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: detoxMobileTestSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
