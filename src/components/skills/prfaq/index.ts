import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { createPrdSkill } from "../create-prd/index";

export const prfaqSkill = defineSkill({
  id: "prfaq",
  fullName: "PRFAQ（新闻稿 + FAQ）",
  description: "当用户要用 PRFAQ 或 Working Backwards 验证产品想法、对齐团队认知或推动立项时使用。",
  useCases: [
    "新产品/功能立项前，用\"从终点倒推\"的方式验证用户价值主张。",
    "需要在团队或管理层之间对齐\"我们到底要做什么、为谁做\"。",
    "与 `create-prd` 配合：PRFAQ 先定\"为什么做\"，PRD 再定\"怎么做\"。",
  ],
  constraints: [
    "新闻稿必须从**用户视角**写，不是从公司视角；主语是用户，不是\"我们\"。",
    "新闻稿限 1 页（≤500 字）；FAQ 分内部和外部两组，各 3-5 个问题。",
    "如果写不出让人想点击的标题，说明价值主张还不清楚，先退回去想清楚。",
    "FAQ 必须直面最难的问题（\"为什么现在做\"\"为什么是我们\"\"失败了怎么办\"），不允许只放软球。",
  ],
  checklist: [
    "新闻稿从用户视角撰写，主语不是\"我们的产品\"。",
    "标题让目标用户有点击欲望。",
    "内部 FAQ 包含至少一个\"为什么不做\"类的硬问题。",
    "团队读完后能回答\"做什么、为谁做、为什么现在做\"。",
  ],
  relatedSkills: [
    {
      get id() {
        return createPrdSkill.id;
      },
      reason: "与 `create-prd` 配合：PRFAQ 先定\\\\\\\"为什么做\\\\\\\"，PRD 再定\\\\\\\"怎么做\\\\\\\"。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
