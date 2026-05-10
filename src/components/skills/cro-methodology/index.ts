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
import { redesignMyLandingpageSkill } from "../redesign-my-landingpage/index";

export const croMethodologySkill = defineSkill({
  id: "cro-methodology",
  fullName: "转化优化方法（cro-methodology）",
  description: "在需要审计网站或落地页转化问题、梳理实验假设和设计 A/B 测试，或优化弹窗、注册流程、新手引导、AIDA 漏斗转化时使用。",
  useCases: [
    "页面有流量但转化弱，想知道阻塞点在哪。",
    "需要把访客疑虑、证据缺口和实验优先级整理成可执行方案。",
    "想为页面、表单、CTA 或价格信息设计 A/B 测试。",
  ],
  constraints: [
    "先定义页面目标和关键路径，再审计视觉、文案和证据层。",
    "每个实验必须写清假设、影响机制、成功指标和失败回滚条件。",
    "优化建议应以证据链为主，参考 [RESEARCH](references/RESEARCH.md)、[PERSUASION](references/PERSUASION.md)、[OBJECTIONS](references/OBJECTIONS.md)。",
    "若实验对象是弹窗，转到 [popup-cro](references/popup-cro.md)；若需要产出实现代码，转到 `redesign-my-landingpage`。",
  ],
  checklist: [
    "是否明确了页面目标、主指标和次指标。",
    "是否把问题拆到“流量质量、页面表达、证据、摩擦”四层。",
    "是否按影响和实施成本给实验排序。",
    "是否给出验证窗口和样本量要求。",
  ],
  relatedSkills: [
    {
      get id() {
        return redesignMyLandingpageSkill.id;
      },
      reason: "若实验对象是弹窗，转到 popup-cro；若需要产出实现代码，转到 `redesign-my-landingpage`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "拍脑袋改",
      pass: "先诊断再实验",
    }),
    defineAntiPattern({
      fail: "多变量同改",
      pass: "一次一变量",
    }),
    defineAntiPattern({
      fail: "只看转化不看质量",
      pass: "主副指标同时看",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先定义页面目标、关键路径、主指标、次指标、样本窗口和当前基线。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按流量质量、页面表达、证据链、摩擦四层定位阻塞点。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "根据对象读取相关 reference：页面读 `page-cro`，漏斗读 `funnel-analysis`，注册读 `signup-flow-cro`，弹窗读 `popup-cro`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "把每个问题写成实验假设：问题、假设、实验、主指标、次指标、失败回滚条件。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "按影响、信心、实施成本和学习价值排序实验，一次只改一个主要变量。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "需要产出实现代码或页面重做时联动 `redesign-my-landingpage`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "页面/漏斗目标、主副指标和基线。",
      "流量、表达、证据、摩擦四层诊断。",
      "实验假设表：问题、假设、实验、主指标、次指标。",
      "实验优先级、验证窗口、样本要求和回滚条件。",
    ],
  }),
  references: [
    defineReference({
      id: "aida-funnel",
      source: new URL("./references/aida-funnel.md", import.meta.url),
      target: "references/aida-funnel.md",
      title: "aida-funnel.md",
      summary: "AIDA 漏斗模型：Attention、Interest、Desire、Action 各层转化优化。",
      loadWhen: "需要按 AIDA 模型审计线索转化或优化漏斗各层时读取。",
    }),
    defineReference({
      id: "cro-copywriting",
      source: new URL("./references/COPYWRITING.md", import.meta.url),
      target: "references/COPYWRITING.md",
      title: "COPYWRITING.md",
      summary: "转化优化视角的文案写作原则：CTA 设计、价值主张与说服框架。",
      loadWhen: "需要从转化率角度优化页面文案或 CTA 表述时读取。",
    }),
    defineReference({
      id: "funnel-analysis",
      source: new URL("./references/funnel-analysis.md", import.meta.url),
      target: "references/funnel-analysis.md",
      title: "funnel-analysis.md",
      summary: "漏斗分析完整方法：各层转化率计算、流失点定位与瓶颈诊断。",
      loadWhen: "需要诊断转化漏斗中的流失点或计算各层转化率时读取。",
    }),
    defineReference({
      id: "objections",
      source: new URL("./references/OBJECTIONS.md", import.meta.url),
      target: "references/OBJECTIONS.md",
      title: "OBJECTIONS.md",
      summary: "用户常见异议整理与化解策略：价格、风险、信任等顾虑处理。",
      loadWhen: "需要识别页面中的疑虑缺口或设计 objection handling 时读取。",
    }),
    defineReference({
      id: "onboarding-cro",
      source: new URL("./references/onboarding-cro.md", import.meta.url),
      target: "references/onboarding-cro.md",
      title: "onboarding-cro.md",
      summary: "新手引导流程转化优化：注册步骤、激活漏斗与留存提升策略。",
      loadWhen: "需要优化用户注册流程或新手引导的转化率时读取。",
    }),
    defineReference({
      id: "page-cro",
      source: new URL("./references/page-cro.md", import.meta.url),
      target: "references/page-cro.md",
      title: "page-cro.md",
      summary: "单页面转化审计方法：视觉层级、证据层、摩擦点与行动号召分析。",
      loadWhen: "需要审计单个页面的转化问题或定位转化阻塞点时读取。",
    }),
    defineReference({
      id: "output-format",
      source: new URL("./references/OUTPUT-FORMAT.md", import.meta.url),
      target: "references/OUTPUT-FORMAT.md",
      title: "OUTPUT-FORMAT.md",
      summary: "page-cro 输出格式模板，覆盖 Quick Wins、High-Impact Changes、A/B 测试与文案替换。",
      loadWhen: "需要按统一结构交付页面转化分析结果时读取。",
    }),
    defineReference({
      id: "page-type-frameworks",
      source: new URL("./references/PAGE-TYPE-FRAMEWORKS.md", import.meta.url),
      target: "references/PAGE-TYPE-FRAMEWORKS.md",
      title: "PAGE-TYPE-FRAMEWORKS.md",
      summary: "首页、落地页、定价页、功能页和博客页的分类型 CRO 审查框架。",
      loadWhen: "需要按页面类型选择对应转化优化审查重点时读取。",
    }),
    defineReference({
      id: "persuasion",
      source: new URL("./references/PERSUASION.md", import.meta.url),
      target: "references/PERSUASION.md",
      title: "PERSUASION.md",
      summary: "说服策略在转化优化中的应用：社会认同、权威背书、稀缺性等框架。",
      loadWhen: "需要设计说服机制或增强页面证据链时读取。",
    }),
    defineReference({
      id: "popup-cro",
      source: new URL("./references/popup-cro.md", import.meta.url),
      target: "references/popup-cro.md",
      title: "popup-cro.md",
      summary: "弹窗转化优化策略：时机、触发条件、文案与关闭路径最佳实践。",
      loadWhen: "需要优化弹窗类组件的转化效果或减少用户反感时读取。",
    }),
    defineReference({
      id: "research",
      source: new URL("./references/RESEARCH.md", import.meta.url),
      target: "references/RESEARCH.md",
      title: "RESEARCH.md",
      summary: "CRO 研究方法论：用户研究、数据分析、热图与调查方法。",
      loadWhen: "需要收集用户行为数据或进行转化问题研究时读取。",
    }),
    defineReference({
      id: "signup-flow-cro",
      source: new URL("./references/signup-flow-cro.md", import.meta.url),
      target: "references/signup-flow-cro.md",
      title: "signup-flow-cro.md",
      summary: "注册流程转化优化：表单设计、步骤简化与验证路径最佳实践。",
      loadWhen: "需要优化注册表单的转化率或减少注册流程摩擦时读取。",
    }),
    defineReference({
      id: "testing-methodology",
      source: new URL("./references/testing-methodology.md", import.meta.url),
      target: "references/testing-methodology.md",
      title: "testing-methodology.md",
      summary: "A/B 测试方法完整指南：假设撰写、样本量计算、实验周期与结果解读。",
      loadWhen: "需要设计 A/B 测试方案或解读实验数据时读取。",
    }),
  ],
});
