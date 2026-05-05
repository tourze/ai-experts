import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "aida-funnel",
      source: new URL("./references/aida-funnel.md", import.meta.url),
      target: "references/aida-funnel.md",
      title: "aida-funnel.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "copywriting",
      source: new URL("./references/COPYWRITING.md", import.meta.url),
      target: "references/COPYWRITING.md",
      title: "COPYWRITING.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "funnel-analysis",
      source: new URL("./references/funnel-analysis.md", import.meta.url),
      target: "references/funnel-analysis.md",
      title: "funnel-analysis.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "objections",
      source: new URL("./references/OBJECTIONS.md", import.meta.url),
      target: "references/OBJECTIONS.md",
      title: "OBJECTIONS.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "onboarding-cro",
      source: new URL("./references/onboarding-cro.md", import.meta.url),
      target: "references/onboarding-cro.md",
      title: "onboarding-cro.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "page-cro",
      source: new URL("./references/page-cro.md", import.meta.url),
      target: "references/page-cro.md",
      title: "page-cro.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "persuasion",
      source: new URL("./references/PERSUASION.md", import.meta.url),
      target: "references/PERSUASION.md",
      title: "PERSUASION.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "popup-cro",
      source: new URL("./references/popup-cro.md", import.meta.url),
      target: "references/popup-cro.md",
      title: "popup-cro.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "research",
      source: new URL("./references/RESEARCH.md", import.meta.url),
      target: "references/RESEARCH.md",
      title: "RESEARCH.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "signup-flow-cro",
      source: new URL("./references/signup-flow-cro.md", import.meta.url),
      target: "references/signup-flow-cro.md",
      title: "signup-flow-cro.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "testing-methodology",
      source: new URL("./references/testing-methodology.md", import.meta.url),
      target: "references/testing-methodology.md",
      title: "testing-methodology.md",
      summary: "Reference material for cro-methodology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
