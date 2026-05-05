import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
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
