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
import { fanOperationsSkill } from "../fan-operations/index";

export const xiaohongshuCommercialGrowthSkill = defineSkill({
  id: "xiaohongshu-commercial-growth",
  fullName: "小红书商业增长",
  description: "当用户要制定小红书商业增长、店铺转化、蒲公英投放、种草链路、私域承接或变现方案时使用。",
  useCases: [
    "账号还没跑通，需要先定定位、内容结构和增长目标。",
    "品牌、商家、创始人 IP、知识博主或实体店要做小红书增长与变现。",
    "需要把内容、搜索、店铺、直播、达人合作和私域承接串成闭环。",
    "需要输出图文内容时，参考图文生成相关方法。",
    "需要落评论区和粉丝维护动作时，联动 `fan-operations`。",
  ],
  constraints: [
    "先定义商业路径，再定义内容；不要反过来。",
    "“最新平台政策、收费、处罚、工具权限”都属于时变信息，用户问到最新时必须先核验。",
    "不把泛流量当最终目标，商业场景优先看精准流量、转粉、线索和成交。",
    "不提供违规导流、刷量或规避平台规则的做法。",
    "单账号模型没跑通前，不默认建议上矩阵。",
  ],
  checklist: [
    "已明确主体、目标、资源、卡点和当前数据。",
    "已区分自然流量、搜索流量、店铺成交和私域承接的角色。",
    "输出里包含可执行的“首周动作”，不是只有概念。",
    "涉及时变规则时，明确提示需要核验。",
    "图文输出、评论区动作、私域承接分别交给了对应技能，而不是在一个回答里硬塞所有细节。",
  ],
  relatedSkills: [
    {
      get id() {
        return fanOperationsSkill.id;
      },
      reason: "需要落评论区和粉丝维护动作时，联动 `fan-operations`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "先投放后补承接",
      pass: "先承接再开闸",
    }),
    defineAntiPattern({
      fail: "通用方案套所有",
      pass: "按业务定制",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先定义商业路径，再定义内容；输入至少包含主体、产品/服务、目标人群、资源、当前数据、目标和卡点。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "用业务诊断区分内容定位、流量路径和变现路径；自然流量、搜索、店铺成交、直播、达人和私域承接各自说明角色。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "需要完整定位、投放和复盘读取 playbook；需要阶段检查读取 checklists；需要图文笔记读取 xhs-graphic-generator。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "输出必须包含首周动作，单账号模型未跑通前不默认建议矩阵；涉及最新规则、收费、处罚和工具权限时先核验。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "业务诊断：主体、产品/服务、目标人群、当前卡点、核心判断和商业路径。",
      "内容定位、流量路径、变现路径、首周动作、承接检查和复盘指标。",
      "需要图文生成、评论区维护、私域承接或平台规则核验的明确分工。",
    ],
  }),
  references: [
    defineReference({
      id: "checklists",
      source: new URL("./references/checklists.md", import.meta.url),
      target: "references/checklists.md",
      title: "checklists.md",
      summary: "小红书商业增长各阶段的操作检查清单，从定位、内容到转化全流程。",
      loadWhen: "需要按阶段逐项检查商业增长策略的完整性和执行进度时读取。",
    }),
    defineReference({
      id: "playbook",
      source: new URL("./references/playbook.md", import.meta.url),
      target: "references/playbook.md",
      title: "playbook.md",
      summary: "小红书商业增长行动手册，包括定位、内容结构、投放和私域承接的实战方案。",
      loadWhen: "需要系统性的小红书增长执行方案，从定位到变现串成全流程时读取。",
    }),
    defineReference({
      id: "xhs-graphic-generator",
      source: new URL("./references/xhs-graphic-generator.md", import.meta.url),
      target: "references/xhs-graphic-generator.md",
      title: "xhs-graphic-generator.md",
      summary: "小红书图文笔记生成指南，包括封面设计、正文结构和话题标签策略。",
      loadWhen: "需要制作小红书图文笔记内容时读取。",
    }),
  ],
});
