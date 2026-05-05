import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const miniprogramDevelopmentSkill = defineSkill({
  id: "miniprogram-development",
  fullName: "Miniprogram Development",
  description: "当用户提到微信小程序、小程序页面、组件、project.config.json、appid、真机预览、miniprogram-ci、CloudBase 或 wx.cloud 时使用。",
  useCases: [
    "需要创建、修改或排查微信小程序页面、组件、分包、路由和项目结构。",
    "需要检查 `project.config.json`、`app.json`、页面级 `.json`、资源路径、`appid` 或构建配置。",
    "需要规划开发者工具调试、预览、上传、真机验证或 `miniprogram-ci` 自动化链路。",
    "代码或需求明确出现 `wx.cloud`、CloudBase、腾讯云开发、云函数、云数据库、云存储等关键词。",
    "需要继续细化 CloudBase 集成时，先读 [CloudBase 集成参考](references/cloudbase-integration.md)。",
    "需要继续细化调试、预览、上传流程时，先读 [开发者工具与预览参考](references/devtools-debug-preview.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "cloudbase-integration",
      source: new URL("./references/cloudbase-integration.md", import.meta.url),
      target: "references/cloudbase-integration.md",
      title: "cloudbase-integration.md",
      summary: "Reference material for miniprogram-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "devtools-debug-preview",
      source: new URL("./references/devtools-debug-preview.md", import.meta.url),
      target: "references/devtools-debug-preview.md",
      title: "devtools-debug-preview.md",
      summary: "Reference material for miniprogram-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
