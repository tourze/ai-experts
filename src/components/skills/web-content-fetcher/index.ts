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
import { procedureUse, webContentFetcherFetch } from "../../procedures/index";

import { deepResearchSkill } from "../deep-research/index";

export const webContentFetcherSkill = defineSkill({
  id: "web-content-fetcher",
  fullName: "网页正文提取",
  description: "当用户给出具体 URL，需要抓取网页正文并转成 Markdown 时使用。适用于博客、文档、新闻页和微信公众号等页面的正文提取与内容准备。",
  useCases: [
    "用户直接给出 URL，让你“读一下 / 抓一下 / 提取正文 / 总结这篇文章”。",
    "需要把页面内容转成 Markdown，再交给其他流程处理。",
    "常作为 `deep-research` 的正文抓取阶段。在深度研究流水线中，可先用 [references/question-refiner.md](references/question-refiner.md) 完善问题后再抓取。",
    "如果只是做技术资讯聚合而不是抓单页正文，参考资讯聚合相关方法。",
  ],
  constraints: [
    "主入口是 `web-content-fetcher-fetch` procedure，使用 Node.js 内置 `fetch`，不依赖 Python 包。",
    "每个 URL 先选一种模式执行，不要无脑循环重试。",
    "`--stealth` 使用更接近浏览器的请求头，但不执行 JavaScript；遇到强 JS 渲染页面时应及时切换到浏览器或其他抓取方案。",
    "默认 fast 模式会在内容过短时自动用 browser-header 模式重试，因此大多数静态站点无需手动指定 `--stealth`。",
    "如果脚本失败，可以再考虑其他非脚本方案；不要把多次失败的同一 URL 反复塞进上下文。",
  ],
  checklist: [
    "当前环境是否有可用 `node`。",
    "是否根据域名选择了合适模式，而不是所有站点都强制 stealth。",
    "是否优先读取 JSON/Markdown 正文，而不是直接拿错误日志当内容。",
    "对提取失败的 URL，是否及时停止重试并回到上层研究流程。",
    "图片懒加载站点的正文里，图片链接是否被正确替换到 Markdown。",
  ],
  relatedSkills: [
    {
      get id() {
        return deepResearchSkill.id;
      },
      reason: "常作为 `deep-research` 的正文抓取阶段。在深度研究流水线中，可先用 references/question-refiner.md 完善问题后再抓取。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "无脑重试同 URL",
      pass: "失败 2 次即停",
    }),
    defineAntiPattern({
      fail: "请求头敏感站点不加 --stealth",
      pass: "域名路由",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认用户给的是具体 URL；深度研究前需要精炼问题时读取 `question-refiner`。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "根据域名选择模式：微信公众号、知乎专栏、掘金优先 stealth；少数派、CSDN、OpenAI、Google Blog 先默认模式。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "默认 fast 模式内容过短会自动用 browser-header 重试，不要对同一 URL 无脑重复调用。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "提取失败两次后停止重试，保留错误和模式信息，回到上层研究流程选择浏览器或其他方案。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "URL、抓取模式、procedure 输出和 Markdown 正文路径或内容。",
      "正文长度、图片链接替换、失败原因和是否需要切换方案。",
      "可交给 deep-research、总结、引用整理或其他流程的清洗正文。",
    ],
  }),
  procedures: [
    procedureUse(webContentFetcherFetch),
  ],
  references: [
    defineReference({
      id: "question-refiner",
      source: new URL("./references/question-refiner.md", import.meta.url),
      target: "references/question-refiner.md",
      title: "question-refiner.md",
      summary: "抓取前的问题优化指南，帮助明确抓取目标、筛选域和设定内容范围。",
      loadWhen: "需要在抓取网页前先精炼问题定义或筛选信息来源时读取。",
    }),
  ],
});
