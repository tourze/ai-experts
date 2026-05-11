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
      get skill() {
        return techDebtSkill;
      },
      reason: "`tech-debt`：技术债识别、排序与治理。",
    },
    {
      get skill() {
        return softwareDesignSkill;
      },
      reason: "`software-design`：设计原则与架构模式，从复杂度、深模块和信息隐藏角度评估设计。",
    },
    {
      get skill() {
        return architectureReviewerSkill;
      },
      reason: "需要做架构设计质量评审，而不只是结构事实取证时联动。",
    },
    {
      get skill() {
        return deepCodeReadSkill;
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "模块地图：列出目录/包边界、public interface 和职责声明，标注 ownership 模糊点。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "依赖图：绘制 import/require/use 关系，识别循环依赖、越层调用和不必要耦合。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "架构合规：对照 MVC、Clean Architecture、Hexagonal 或本仓库声明约束，检测违规点。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "状态流：追踪核心业务对象生命周期，包括入口、处理、输出、错误路径、副作用和状态转移。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "变更热点：用 git 历史识别高 churn 文件、shotgun surgery 模式和长寿分支波及面。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "健康度评分：按模块边界清晰度、依赖复杂度、分层合规率和变更热点密度给出 S1-S5 评级。",
      }),
      defineWorkflowStep({
        id: "step-7",
        label: "修改指南：为核心模块给出新增功能、改变行为、扩展接口的具体操作路径；详细命令模板读取 `code-patterns` reference。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "模块地图、public interface、职责边界和 ownership 模糊点。",
      "依赖图、循环依赖、越层调用和耦合风险。",
      "状态流、错误路径、副作用和架构合规发现。",
      "S1-S5 结构健康度、优先改进项和修改指南。",
    ],
  }),
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
