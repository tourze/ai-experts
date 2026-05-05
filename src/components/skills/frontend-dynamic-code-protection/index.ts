import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const frontendDynamicCodeProtectionSkill = defineSkill({
  id: "frontend-dynamic-code-protection",
  fullName: "前端动态化代码保护",
  description: "当用户需要为 H5/Web 前端的人机对抗、防刷量、反爬虫、请求参数保护、JavaScript 混淆或动态化代码保护设计、审计或改进方案时使用；尤其是登录注册、投票领券、风控校验、API 参数签名、客户端加密和高收益活动页面。",
  useCases: [
    "高收益 Web/H5 页面面临脚本刷量、请求伪造、批量注册、投票、领券或爬虫采集。",
    "需要审计“客户端加密”“参数签名”“JS 混淆”“anti-bot challenge”是否只是表面保护。",
    "需要设计短生命周期、动态生成、服务端可验证的前端保护逻辑。",
    "需要把前端保护接入威胁建模、风控、缓存、构建和验收测试。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
