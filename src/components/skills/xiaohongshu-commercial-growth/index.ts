import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
  relatedSkills: [
    {
      get id() {
        return fanOperationsSkill.id;
      },
      reason: "需要落评论区和粉丝维护动作时，联动 `fan-operations`。",
    },
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
      summary: "Reference material for xiaohongshu-commercial-growth.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "playbook",
      source: new URL("./references/playbook.md", import.meta.url),
      target: "references/playbook.md",
      title: "playbook.md",
      summary: "Reference material for xiaohongshu-commercial-growth.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "xhs-graphic-generator",
      source: new URL("./references/xhs-graphic-generator.md", import.meta.url),
      target: "references/xhs-graphic-generator.md",
      title: "xhs-graphic-generator.md",
      summary: "Reference material for xiaohongshu-commercial-growth.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
