import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
import { uxHeuristicsSkill } from "../ux-heuristics/index";

export const uxResearcherDesignerSkill = defineSkill({
  id: "ux-researcher-designer",
  fullName: "UX Researcher Designer",
  description: "当用户需要做用户研究、需求验证、persona 构建或设计复盘时使用（设计视角：访谈→persona→设计输入）。市场/客户研究用 `customer-research`；旅程图触点可视化用 `customer-journey-map`。",
  useCases: [
    "要从访谈、问卷、埋点、客服记录中提炼 Persona，而不是凭感觉写角色卡。",
    "要梳理端到端旅程，找出每一阶段的动作、触点、情绪和阻塞点。",
    "要为新流程、新页面制定可用性测试计划和成功指标。",
    "要把原始研究记录压成“发现 → 证据 → 建议”的交付物。",
    "如果问题已经明确是界面启发式错误，先用 `ux-heuristics`。",
    "工具、模板与方法细节分别在 [persona-methodology](references/persona-methodology.md)、[journey-mapping-guide](references/journey-mapping-guide.md)、[usability-testing-frameworks](references/usability-testing-frameworks.md)、[research-plan-template](assets/research_plan_template.md)。",
  ],
  constraints: [
    "没有真实数据就明确说“假设版”，不要伪装成已验证 Persona。",
    "Persona 至少要说明数据来源、样本量、信心等级和推断边界。",
    "访谈原话、行为事实、研究推断必须分层呈现，不能混写。",
    "旅程图先定义范围：用户类型、目标、起点、终点、时间跨度。",
    "可用性测试任务必须写成场景，不要写成“点击这里、再点那里”的操作说明。",
    "使用脚本时优先传入真实 JSON 数据；只有演示场景才使用 `--sample`。",
  ],
  checklist: [
    "Persona 至少包含样本量、数据来源、信心等级。",
    "痛点有频次或证据，不是凭印象列举。",
    "研究结论能追溯到原始访谈、行为数据或支持记录。",
    "旅程图的范围、目标和成功标准已写清楚。",
    "可用性测试任务是“场景+目标+成功条件”，而不是操作脚本。",
    "建议项已经按影响面、严重度、可解性排序。",
    "需要设计落地时，已把输出交给相关 skill 或前端实现团队。",
  ],
  relatedSkills: [
    {
      get id() {
        return uxHeuristicsSkill.id;
      },
      reason: "如果问题已经明确是界面启发式错误，先用 `ux-heuristics`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "2 次访谈出 Persona",
      pass: "显式样本 + 信心等级",
    }),
    defineAntiPattern({
      fail: "自述 = 事实",
      pass: "看行为而非意愿",
    }),
    defineAntiPattern({
      fail: "只 happy path",
      pass: "失败与恢复",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "persona-generator",
      entry: new URL("./scripts/persona_generator.mjs", import.meta.url),
      target: "scripts/persona_generator.mjs",
      runtime: "node",
      bundle: false,
      description: "Script persona_generator.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "example-personas",
      source: new URL("./references/example-personas.md", import.meta.url),
      target: "references/example-personas.md",
      title: "example-personas.md",
      summary: "不同场景下的 Persona 示例，展示数据来源、样本量和信心等级的写法。",
      loadWhen: "需要参考真实 Persona 案例来构建自己的角色模型时读取。",
    }),
    defineReference({
      id: "journey-mapping-guide",
      source: new URL("./references/journey-mapping-guide.md", import.meta.url),
      target: "references/journey-mapping-guide.md",
      title: "journey-mapping-guide.md",
      summary: "用户体验旅程图绘制指南，包括范围定义、触点识别和情绪曲线。",
      loadWhen: "需要绘制端到端旅程图或分析用户触点和阻塞点时读取。",
    }),
    defineReference({
      id: "persona-methodology",
      source: new URL("./references/persona-methodology.md", import.meta.url),
      target: "references/persona-methodology.md",
      title: "persona-methodology.md",
      summary: "用户 Persona 构建方法论，从访谈、问卷和埋点数据中提炼角色特征。",
      loadWhen: "需要从研究数据中构建有实证基础的 Persona 时读取。",
    }),
    defineReference({
      id: "usability-testing-frameworks",
      source: new URL("./references/usability-testing-frameworks.md", import.meta.url),
      target: "references/usability-testing-frameworks.md",
      title: "usability-testing-frameworks.md",
      summary: "可用性测试框架与方法，包括测试任务设计、成功指标和结果分析方法。",
      loadWhen: "需要制定可用性测试计划、设计测试场景或定义成功指标时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "research-plan-template",
      source: new URL("./assets/research_plan_template.md", import.meta.url),
      target: "assets/research_plan_template.md",
    })
  ],
});
