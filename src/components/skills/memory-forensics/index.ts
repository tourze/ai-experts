import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { binaryAnalysisPatternsSkill } from "../binary-analysis-patterns/index";

export const memoryForensicsSkill = defineSkill({
  id: "memory-forensics",
  fullName: "内存取证",
  description: "当需要分析 RAM 镜像中的进程、注入、网络连接、凭据痕迹或 rootkit 线索时使用。",
  useCases: [
    "需要用 Volatility 等工具分析内存镜像的进程、模块、句柄、网络、注入和持久化痕迹。",
    "需要与 `binary-analysis-patterns` 联动定位可疑模块。",
    "面对反调试或壳层样本时，可结合 `anti-reversing-techniques` 解释运行时差异。",
  ],
  constraints: [
    "保存原始镜像与哈希，所有分析基于副本进行。",
    "先做时间线、进程树和网络基线，再提取载荷。",
    "所有结论都要锚定对象偏移、PID、模块名或时间戳。",
    "区分“未找到证据”和“证据表明不存在”。",
  ],
  checklist: [
    "确认镜像来源、平台版本、采集时间和时区。",
    "先看进程、命令行、网络、模块，再深入注入与句柄。",
    "对可疑对象记录偏移和关联关系。",
    "导出样本前说明证据完整性和命名规则。",
  ],
  relatedSkills: [
    {
      get id() {
        return binaryAnalysisPatternsSkill.id;
      },
      label: "anti-reversing-techniques",
      reason: "面对反调试或壳层样本时，可结合 `anti-reversing-techniques` 解释运行时差异。",
    },
    {
      get id() {
        return binaryAnalysisPatternsSkill.id;
      },
      reason: "需要与 `binary-analysis-patterns` 联动定位可疑模块。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不确认镜像类型",
      pass: "先 windows.info / banners",
    }),
    defineAntiPattern({
      fail: "单插件下结论",
      pass: "多插件交叉",
    }),
    defineAntiPattern({
      fail: "改原始证据",
      pass: "哈希 + 副本",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
