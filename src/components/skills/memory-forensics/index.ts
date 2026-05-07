import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
      reason: "需要与 `binary-analysis-patterns` 联动定位可疑模块；面对反调试或壳层样本时，结合其中的 anti-reversing 资料解释运行时差异。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认镜像来源、平台、采集时间、时区、哈希和 Volatility profile / symbol 状态。",
      "建立基线：系统信息、进程树、命令行、网络连接、模块和句柄。",
      "围绕异常进程、网络端点、可疑模块和注入痕迹做多插件交叉验证。",
      "导出对象前记录 offset、PID、路径、hash 和关联时间线，原始镜像只读保存。",
      "常用 Volatility 初筛命令读取 `volatility-triage`；可疑模块再交给 `binary-analysis-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "镜像元数据、哈希、平台版本、采集时间和分析工具版本。",
      "进程、网络、模块、句柄、注入和时间线中的关键证据。",
      "可疑对象列表，含 offset、PID、模块名、时间戳、置信度和下一步提取建议。",
    ],
  }),
  references: [
    defineReference({
      id: "volatility-triage",
      source: new URL("./references/volatility-triage.md", import.meta.url),
      target: "references/volatility-triage.md",
      title: "Volatility 内存取证初筛命令",
      summary: "windows.info、pslist、pstree、cmdline、netscan、malfind 等常用初筛命令。",
      loadWhen: "需要对内存镜像做进程、网络、模块或注入初筛时读取。",
    }),
  ],
});
