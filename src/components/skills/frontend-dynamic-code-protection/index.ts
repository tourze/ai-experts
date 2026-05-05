import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const frontendDynamicCodeProtectionSkill = defineSkill({
  id: "frontend-dynamic-code-protection",
  fullName: "前端动态化代码保护",
  description: "当用户需要为 H5/Web 前端的人机对抗、防刷量、反爬虫、请求参数保护、JavaScript 混淆或动态化代码保护设计、审计或改进方案时使用；尤其是登录注册、投票领券、风控校验、API 参数签名、客户端加密和高收益活动页面。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for frontend-dynamic-code-protection.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
