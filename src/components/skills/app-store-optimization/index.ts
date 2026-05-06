import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { scriptUse } from "../../scripts/index";

export const appStoreOptimizationSkill = defineSkill({
  id: "app-store-optimization",
  fullName: "App Store ASO 优化",
  description: "当用户要做 App Store / Google Play 的 ASO 优化、生成发布说明、版本更新文案或门店更新摘要时使用。",
  useCases: [
    "需要评估关键词、标题、副标题、描述和关键词字段。",
    "需要分析竞品、评论趋势、评分结构和增长优先级。",
    "需要设计素材或元数据 A/B 测试方案。",
    "需要规划多语言本地化、发版节奏和上线检查清单。",
    "需要从最近一个 tag 到当前版本提炼 App Store「新内容」文案。",
    "需要把技术提交整理成用户能看懂的发布摘要。",
  ],
  constraints: [
    "这些 `src/components/scripts/sources/app-store-optimization/*.ts` 主要是库模块；优先通过 `npx tsx --eval` 导入调用，不要假设每个文件都提供稳定 CLI。",
    "搜索量、竞争度、转化率等输入必须来自用户或可信数据源；不要伪造市场数据。",
    "Apple 与 Google 的字段限制不同，所有输出都必须带字符数校验。",
    "本地化不是逐词翻译，必须同时考虑市场、文化语义和搜索行为。",
    "更新文案规则：先确认真实改动范围再写，只保留用户可感知改动，每条必须可追溯到真实提交；详见 `references/changelog-guide.md`。",
  ],
  checklist: [
    "元数据优化优先用 `metadata_optimizer.ts`，并校验 Apple / Google 字符上限。",
    "关键词分析优先用 `keyword_analyzer.ts`，竞品对标优先用 `competitor_analyzer.ts`。",
    "评论洞察用 `review_analyzer.ts`，不要把低星评论直接等同于真实需求。",
    "发版准备使用 `launch_checklist.ts`，测试规划使用 `ab_test_planner.ts`。",
    "交叉引用：需要审核合规视角时切到 `apple-appstore-reviewer`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "无证据的”高搜索低竞争”",
      pass: "基于真实数据",
    }),
    defineAntiPattern({
      fail: "直译代替本地化",
      pass: "按本地搜索习惯",
    }),
    defineAntiPattern({
      fail: "一次改所有东西",
      pass: "单变量 + 归因",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    scriptUse("app-store-optimization-ab-test-planner"),
    scriptUse("app-store-optimization-aso-scorer"),
    scriptUse("app-store-optimization-competitor-analyzer"),
    scriptUse("app-store-optimization-collect-release-changes"),
    scriptUse("app-store-optimization-keyword-analyzer"),
    scriptUse("app-store-optimization-launch-checklist"),
    scriptUse("app-store-optimization-localization-helper"),
    scriptUse("app-store-optimization-metadata-optimizer"),
    scriptUse("app-store-optimization-review-analyzer"),
  ],
  references: [
    defineReference({
      id: "changelog-guide",
      source: new URL("./references/changelog-guide.md", import.meta.url),
      target: "references/changelog-guide.md",
      title: "changelog-guide.md",
      summary: "App Store 更新日志撰写指南：用户可感知改动提取与追溯规则。",
      loadWhen: "需要从提交记录中提取用户可感知的版本更新内容时读取。",
    }),
    defineReference({
      id: "release-notes-guidelines",
      source: new URL("./references/release-notes-guidelines.md", import.meta.url),
      target: "references/release-notes-guidelines.md",
      title: "release-notes-guidelines.md",
      summary: "App Store 与 Google Play 版本发布说明格式规范与最佳实践。",
      loadWhen: "需要撰写多平台版本发布说明或检查字符数限制时读取。",
    }),
  ],
});
