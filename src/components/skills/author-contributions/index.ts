import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const authorContributionsSkill = defineSkill({
  id: "author-contributions",
  fullName: "作者贡献追踪",
  description: "当用户要查看某个作者在分支上的提交、diff、文件归属、贡献统计或回答“谁改了什么”时使用。",
  useCases: [
    "用户要看某个作者在当前分支相对 `main` 或其他上游分支的真实贡献面。",
    "需要区分“作者直接修改了这个文件”和“作者改的是旧路径，后来被别人 rename 到当前路径”。",
    "合并前要核对作者实际涉及的落地文件，而不是只看 commit 数量。",
  ],
  constraints: [
    "只做只读分析，不改分支、不改索引、不改工作树。",
    "先确定作者的精确 Git 身份，再做 `--author=` 过滤；禁止凭昵称或缩写猜测。",
    "rename 图必须覆盖分支上的全部提交，不能只看目标作者自己的 commit。",
    "最终只汇报 `git diff <upstream>..<branch>` 里仍然会落地的文件；已经被删掉、不会合并的路径不要报。",
    "大仓库优先用 Python 做集合与 rename 图计算，不要写脆弱的 shell 管道循环。",
  ],
  checklist: [
    "是否先跑了作者身份枚举，而不是直接写 `--author=xxx`。",
    "是否同时拿到了 `author_files`、`rename_map` 和最终 merge diff 文件列表。",
    "是否对 rename 做了传递闭包，而不是只查一跳。",
    "是否只输出最终会落地的文件，并补了 `git diff --stat` 统计。",
    "是否在结论里区分了 `DIRECT` 与 `VIA_RENAME`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "模糊作者名",
      pass: "精确身份",
    }),
    defineAntiPattern({
      fail: "不核对最终落地",
      pass: "与 merge diff 交集",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先用 `git log --format=\"%an <%ae>\" <upstream>..<branch> | sort -u` 枚举精确作者身份。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按精确 `--author=` 收集作者 commit，再用 `git diff-tree --no-commit-id --name-only -r <hash>` 合并 `author_files`。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "对整条分支所有 commit 跑 `git diff-tree --no-commit-id -r -M <hash>`，构建 `new_path -> old_paths` rename 图。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "rename 追踪必须做传递闭包，支持 `a -> b -> c` 多跳，不只查一跳。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "最终文件只取 `git diff --name-only <upstream>..<branch>`，再与 author_files 和 rename 祖先求交。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "输出时用 `git diff --stat <upstream>..<branch> -- <files>` 补统计，标记 DIRECT 或 VIA_RENAME。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "作者身份枚举、选定精确身份、upstream/branch 范围和只读分析说明。",
      "最终落地文件表：路径、DIRECT/VIA_RENAME、命中 commit、rename 链和 diff stat。",
      "排除说明：作者动过但最终删除、未进入 merge diff 或仅历史路径命中的文件。",
    ],
  }),
});
