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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
