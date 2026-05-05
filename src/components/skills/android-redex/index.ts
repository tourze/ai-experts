import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const androidRedexSkill = defineSkill({
  id: "android-redex",
  fullName: "ReDex — Android 字节码优化",
  description: "当用户要用 ReDex 优化 Android APK 体积/性能、配置 pass 或排查优化问题时使用。",
  useCases: [
    "当用户要用 ReDex 优化 Android APK 体积/性能、配置 pass 或排查优化问题时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不验证签名对齐",
      pass: "完整 CI 链路",
    }),
    defineAntiPattern({
      fail: "激进 pass 组合：过度优化导致运行时崩溃 / 反射失效",
      pass: "渐进启用",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "installation",
      source: new URL("./references/installation.md", import.meta.url),
      target: "references/installation.md",
      title: "installation.md",
      summary: "ReDex 工具安装指南：源码编译与预构建包选择。",
      loadWhen: "需要安装或更新 ReDex 工具链时读取。",
    }),
    defineReference({
      id: "passes",
      source: new URL("./references/passes.md", import.meta.url),
      target: "references/passes.md",
      title: "passes.md",
      summary: "ReDex Pass 详解：各 pass 功能、配置参数与优化效果。",
      loadWhen: "需要选择或配置 ReDex 优化 pass、评估优化组合风险时读取。",
    }),
    defineReference({
      id: "troubleshooting",
      source: new URL("./references/troubleshooting.md", import.meta.url),
      target: "references/troubleshooting.md",
      title: "troubleshooting.md",
      summary: "ReDex 优化问题排查：运行时崩溃、反射失效与签名校验失败。",
      loadWhen: "需要诊断 ReDex 优化后出现的运行时异常或兼容性问题时读取。",
    }),
  ],
});
