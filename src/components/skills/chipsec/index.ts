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
import { binaryAnalysisPatternsSkill } from "../binary-analysis-patterns/index";

export const chipsecSkill = defineSkill({
  id: "chipsec",
  fullName: "固件静态安全分析",
  description: "当需要用 CHIPSEC 对 UEFI/BIOS 固件镜像做离线解析、模块检查和已知风险核对时使用。",
  useCases: [
    "需要对 `.bin`、`.rom`、`.fd`、`.cap` 等固件镜像做结构和安全配置分析。",
    "需要在离线环境先做快速风险筛查，再决定是否进入更细的固件逆向。",
  ],
  constraints: [
    "优先离线分析原始 dump；任何写入类动作都必须额外确认。",
    "保留原始镜像哈希，所有派生产物放独立目录。",
    "先确认平台、芯片组和镜像来源，再解释结果。",
    "把平台限制、未知模块和工具误报单独标注。",
  ],
  checklist: [
    "镜像来源、采集方式、哈希和平台信息是否已确认，并报告证据？",
    "写保护、SPI 描述符、UEFI 模块清单和可疑持久化痕迹是否已检查并记录风险？",
    "把工具报错与真实发现分开记录。",
    "需要写操作时，明确提示风险和回退方案。",
  ],
  relatedSkills: [
    {
      get skill() {
        return binaryAnalysisPatternsSkill;
      },
      reason: "需要结合 `binary-analysis-patterns` 深挖 EFI 可执行模块。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "直接跑修改类模块",
      pass: "离线只读优先",
    }),
    defineAntiPattern({
      fail: "\"异常\"=恶意",
      pass: "区分异常与恶意",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认固件来源、采集方式、哈希、平台信息和文件格式，所有分析基于副本进行。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "优先执行离线只读命令：EFI inventory、blocked threat scan、UEFI decode 和 NVRAM 提取。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "把 CHIPSEC 的 WARNING / FAILED / module error 与真实安全结论分开记录。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "需要深挖 EFI 可执行模块时联动 `binary-analysis-patterns`，不要直接进入 live system 写操作。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "命令、flag、exit code、workflow、威胁库和排错方式读取 `offline-analysis-guide` reference。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "固件来源、哈希、平台信息、文件格式和分析目录。",
      "EFI inventory、blocked scan、decode、NVRAM 提取的结果摘要和原始输出位置。",
      "安全发现、误报 / 不适用说明、受影响模块 GUID / SHA256 和后续逆向建议。",
    ],
  }),
  references: [
    defineReference({
      id: "offline-analysis-guide",
      source: new URL("./references/offline-analysis-guide.md", import.meta.url),
      target: "references/offline-analysis-guide.md",
      title: "CHIPSEC 离线固件分析指南",
      summary: "离线 CHIPSEC 模块、常用 flag、扫描 workflow、结果解释、威胁库和排错方式。",
      loadWhen: "需要实际运行 CHIPSEC 固件 dump 分析或解释扫描输出时读取。",
    }),
  ],
});
