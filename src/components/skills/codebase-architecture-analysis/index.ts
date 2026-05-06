import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { architectureReviewerSkill } from "../architecture-reviewer/index";
import { deepCodeReadSkill } from "../deep-code-read/index";
import { softwareDesignSkill } from "../software-design/index";
import { techDebtSkill } from "../tech-debt/index";

export const codebaseArchitectureAnalysisSkill = defineSkill({
  id: "codebase-architecture-analysis",
  fullName: "代码库架构分析",
  description: "当用户要分析代码库架构、梳理模块边界、绘制依赖图、检测分层违规或评估结构健康度时使用。提供从模块地图到优先改进项的系统化分析流程，每条发现绑定到文件:行/段。",
  useCases: [
    "接手陌生代码库，需要快速建立模块地图",
    "重构前评估，识别高 churn 文件、God module 和扩展点薄弱区域",
    "合并前结构检查，防止引入循环依赖或越层调用",
    "技术债摸底，量化结构健康度并排序改进项",
  ],
  constraints: [
    "每个判断必须绑定到具体文件:行/段，不得凭直觉归类模块。",
    "区分框架惯例（如 Rails `app/models` 放业务逻辑）与真正的分层违规（如 View 直接写 SQL）。",
    "区分主观风格偏好与必须修复的结构风险；风格问题单独标注，不混入风险评分。",
    "未覆盖的模块和路径必须在报告的「范围限制」段显式列出。",
  ],
  relatedSkills: [
    {
      get id() {
        return techDebtSkill.id;
      },
      reason: "`tech-debt`：技术债识别、排序与治理。",
    },
    {
      get id() {
        return softwareDesignSkill.id;
      },
      reason: "`software-design`：设计原则与架构模式，从复杂度、深模块和信息隐藏角度评估设计。",
    },
    {
      get id() {
        return architectureReviewerSkill.id;
      },
      label: "`architecture-reviewer`",
      reason: "``architecture-reviewer``：架构设计评审，侧重设计质量而非结构事实取证",
    },
    {
      get id() {
        return techDebtSkill.id;
      },
      label: "`tech-debt`",
      reason: "``tech-debt``：技术债识别、排序与治理",
    },
    {
      get id() {
        return softwareDesignSkill.id;
      },
      label: "`software-design`",
      reason: "``software-design``：设计原则与架构模式，从复杂度、深模块和信息隐藏角度评估设计",
    },
    {
      get id() {
        return deepCodeReadSkill.id;
      },
      reason: "`deep-code-read`：深度理解不熟悉代码库。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "凭直觉画模块边界：不读取文件内容直接归类，模块边界全凭目录名猜测。没有文件级证据支撑。",
      pass: "文件级证据驱动的模块地图：更多反模式与检查清单见 [references/anti-patterns.md](references/anti-patterns.md)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "架构分析反模式与检查清单：凭直觉画模块边界、证据不足下结论等常见错误。",
      loadWhen: "需要检查架构分析过程是否跳过证据驱动步骤时读取。",
    }),
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "代码库架构分析的模式识别：分层模式、模块化组织与依赖管理示例。",
      loadWhen: "需要参考常见代码结构模式来辅助模块边界划分时读取。",
    }),
  ],
});
