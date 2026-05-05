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
  constraints: [
    "默认按“普通微信小程序”处理，除非用户或代码明确表明项目正在使用 CloudBase。",
    "小程序源码路径必须以 `project.config.json` 中的 `miniprogramRoot` 为准，不能凭目录名臆测。",
    "页面级文件必须成套出现；新增页面至少要同步考虑 `.js/.ts`、`.wxml`、`.wxss`、`.json`。",
    "只有在确认存在有效 `appid` 后，才给出预览、上传、真机调试或 CI 发布建议。",
    "CloudBase 项目禁止套用 Web 登录流；用户身份应由微信侧上下文或云函数 `OPENID` 获取。",
    "本技能只处理小程序端开发与发布路径；纯 Web 前端、通用后端服务、单纯视觉设计不在当前技能范围内。",
  ],
  checklist: [
    "`project.config.json` 是否存在且 `miniprogramRoot`、`compileType`、`appid` 合法。",
    "新增或修改的页面是否同步覆盖 `.js/.ts`、`.wxml`、`.wxss`、`.json`。",
    "页面或组件引用的本地资源是否真实存在，路径是否相对 `miniprogramRoot` 正确。",
    "如果使用 Taro，是否误用了 `document`、`window`、`react-dom` 等 DOM-only API。",
    "如果使用 CloudBase，是否使用了 `wx.cloud` 客户端 API、云函数和 `OPENID` 正确边界。",
    "涉及调试、预览、上传时，是否明确了开发者工具链路、CI 链路以及 `appid`/私钥前置条件。",
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
