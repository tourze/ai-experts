import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, skillsPruneAndSyncReadmeCurateSkills } from "../../procedures/index";

export const skillsPruneAndSyncReadmeSkill = defineSkill({
  id: "skills-prune-and-sync-readme",
  fullName: "Skills Prune And Sync Component Index",
  description: "当用户提到”清理 skills””删除重复/低质量 skill””治理 skill 冲突””更新 README 的 skill 列表”时使用。",
  useCases: [
    "当用户提到”清理 skills””删除重复/低质量 skill””治理 skill 冲突””更新 README 的 skill 列表”时使用。",
  ],
  constraints: [
    "删除前必须先跑审计并输出证据；相似分组只作为人工审计入口，不直接删除。",
    "只有用户明确点名或确认删除名单时才删除 skill，不能基于模糊相似度批量删。",
    "低质量、重复、相似和冲突必须分别判定，不能混成一个“清理”结论。",
    "`.system` 内置 skill 不在删除范围，除非用户单独点名。",
    "README 只更新 `## Skill 清单` 到 `## 数据来源` 之间的区块，数量统计交给同步 procedure。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "模糊相似度批量删",
      pass: "先 audit 再点名删",
    }),
    defineAntiPattern({
      fail: "手动改 README 表格",
      pass: "sync-readme 子命令",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先运行审计 procedure，输出低质量、重复、相似分组和冲突证据。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按证据区分低质量、重复、相似分组和强约束冲突；候选不足以直接删除时先给保留/删除理由。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "只有用户明确要求删除时，按确认名单删除；专项子技能和父技能默认视为家族分层。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "删除后运行 README 同步 procedure，只改 Skill 清单区块并保留现有摘要优先级。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "最后运行校验 procedure，确认 README、数量统计、相对链接和组件清单一致。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "审计报告：低质量、重复、相似分组、冲突和对应证据。",
      "保留/删除建议、用户确认状态、实际删除列表和风险说明。",
      "README 同步结果、校验结果、失败项和需要人工复核的 skill。",
    ],
  }),
  procedures: [
    procedureUse(skillsPruneAndSyncReadmeCurateSkills),
  ],
});
