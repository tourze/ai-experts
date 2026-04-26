#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function dedupeKeepOrder(values) {
  const seen = new Set();
  const ordered = [];
  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    ordered.push(value);
  }
  return ordered;
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function mostCommon(map, limit = null) {
  const items = [...map.entries()].sort((left, right) => right[1] - left[1]);
  return limit == null ? items : items.slice(0, limit);
}

function maxEntry(map) {
  return mostCommon(map, 1)[0];
}

function rankedItem(label, count, key = "label") {
  return { [key]: label, count };
}

function mapGet(map, key) {
  return map.get(key) ?? 0;
}

export class PersonaGenerator {
  constructor(seed = 7) {
    this.seed = seed;
    this.archetypeTemplates = {
      power_user: {
        characteristics: ["高频使用", "追求效率", "偏爱快捷操作"],
        goals: ["缩短任务耗时", "批量处理", "减少重复劳动"],
        frustrations: ["性能慢", "缺少快捷方式", "批量操作弱"],
        quote: "我希望工具能跟上我的节奏，而不是拖慢我。",
      },
      casual_user: {
        characteristics: ["低频使用", "目标明确", "偏好简单路径"],
        goals: ["快速完成单次任务", "尽量少学习", "避免犯错"],
        frustrations: ["入口难找", "步骤太多", "术语难懂"],
        quote: "我只是想把事情做完，不想先研究一遍系统。",
      },
      business_user: {
        characteristics: ["工作场景", "重视协作", "关注结果可追踪"],
        goals: ["提升团队效率", "输出报告", "保证信息同步"],
        frustrations: ["协作能力弱", "缺少报表", "权限管理混乱"],
        quote: "如果结果不能共享和复盘，这个工具就很难进入团队流程。",
      },
      mobile_first: {
        characteristics: ["移动优先", "碎片化使用", "偏好短操作"],
        goals: ["随时处理任务", "少输入", "弱网也能完成"],
        frustrations: ["移动端缺功能", "触控操作别扭", "加载过慢"],
        quote: "很多时候我只有手机，如果关键操作做不了，产品就不可用。",
      },
    };
  }

  generatePersonaFromData(userData, interviewInsights = null) {
    if (!userData.length) {
      throw new Error("user_data 不能为空。");
    }

    const patterns = this.analyzeUserPatterns(userData);
    const archetype = this.identifyArchetype(patterns);
    return {
      name: this.generateName(archetype, patterns),
      archetype,
      tagline: this.generateTagline(patterns, archetype),
      demographics: this.aggregateDemographics(userData),
      psychographics: this.extractPsychographics(patterns, interviewInsights),
      behaviors: this.analyzeBehaviors(userData, patterns),
      needs_and_goals: this.identifyNeeds(patterns, interviewInsights, archetype),
      frustrations: this.extractFrustrations(patterns, interviewInsights, archetype),
      scenarios: this.generateScenarios(archetype, patterns),
      quote: this.selectQuote(interviewInsights, archetype),
      data_points: this.calculateDataPoints(userData, interviewInsights),
      design_implications: this.deriveDesignImplications(patterns, archetype),
    };
  }

  analyzeUserPatterns(userData) {
    const patterns = {
      usage_frequency: new Map(),
      feature_usage: new Map(),
      devices: new Map(),
      contexts: new Map(),
      pain_points: new Map(),
      tech_scores: [],
      user_feature_counts: [],
      sample_size: userData.length,
    };

    for (const user of userData) {
      const freq = String(user.usage_frequency ?? "weekly");
      increment(patterns.usage_frequency, freq);

      const features = (user.features_used ?? []).filter(Boolean).map(String);
      patterns.user_feature_counts.push(features.length);
      for (const feature of features) {
        increment(patterns.feature_usage, feature);
      }

      increment(patterns.devices, String(user.primary_device ?? "desktop"));
      increment(patterns.contexts, String(user.usage_context ?? "general"));

      for (const item of (user.pain_points ?? []).filter(Boolean).map(String)) {
        increment(patterns.pain_points, item);
      }

      if (user.tech_proficiency !== undefined) {
        const score = Number(user.tech_proficiency);
        if (!Number.isNaN(score)) {
          patterns.tech_scores.push(score);
        }
      }
    }

    return patterns;
  }

  identifyArchetype(patterns) {
    const [freqPattern] = maxEntry(patterns.usage_frequency);
    const [devicePattern, deviceCount] = maxEntry(patterns.devices);
    const workCount = mapGet(patterns.contexts, "work");
    const personalCount = mapGet(patterns.contexts, "personal");
    const avgFeatures = patterns.user_feature_counts.length
      ? patterns.user_feature_counts.reduce((sum, count) => sum + count, 0) / patterns.user_feature_counts.length
      : 0;

    if (["mobile", "tablet"].includes(devicePattern) && deviceCount >= Math.max(2, Math.trunc(patterns.sample_size / 3))) {
      return "mobile_first";
    }
    if (workCount > personalCount && workCount >= Math.max(2, Math.trunc(patterns.sample_size / 3))) {
      return "business_user";
    }
    if (freqPattern === "daily" && avgFeatures >= 4) {
      return "power_user";
    }
    return "casual_user";
  }

  stablePick(values, token) {
    const digest = createHash("sha256").update(`${this.seed}:${token}`, "utf-8").digest();
    return values[digest[0] % values.length];
  }

  generateName(archetype, patterns) {
    const names = {
      power_user: ["Alex", "Jordan", "Morgan", "Taylor"],
      casual_user: ["Jamie", "Pat", "Riley", "Casey"],
      business_user: ["Avery", "Cameron", "Blake", "Drew"],
      mobile_first: ["Quinn", "River", "Sage", "Skyler"],
    };
    const roles = {
      power_user: "高效操作型用户",
      casual_user: "目标导向型用户",
      business_user: "协作业务型用户",
      mobile_first: "移动优先型用户",
    };
    const contexts = [...patterns.contexts.entries()].sort();
    const contextToken = `[${contexts.map(([key, value]) => `('${key}', ${value})`).join(", ")}]`;
    const token = `${archetype}:${patterns.sample_size}:${contextToken}`;
    return `${this.stablePick(names[archetype], token)}，${roles[archetype]}`;
  }

  generateTagline(patterns, archetype) {
    const [freq] = maxEntry(patterns.usage_frequency);
    const [context] = maxEntry(patterns.contexts);
    const [device] = maxEntry(patterns.devices);
    const labels = {
      power_user: "追求批量效率与快捷路径",
      casual_user: "希望少思考、少学习、快完成",
      business_user: "关注协作闭环与结果可追踪",
      mobile_first: "依赖移动端完成核心任务",
    };
    return `${freq} 频率、以 ${context} 场景为主，主要通过 ${device} 使用，${labels[archetype]}。`;
  }

  aggregateDemographics(userData) {
    const demographics = {
      age_range: "未提供",
      location_type: "未提供",
      occupation_category: "未提供",
      education_level: "未提供",
      tech_proficiency: "未提供",
    };

    const ages = userData.filter((user) => typeof user.age === "number").map((user) => Math.trunc(user.age));
    if (ages.length) {
      const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
      if (avgAge < 25) {
        demographics.age_range = "18-24";
      } else if (avgAge < 35) {
        demographics.age_range = "25-34";
      } else if (avgAge < 45) {
        demographics.age_range = "35-44";
      } else {
        demographics.age_range = "45+";
      }
    }

    for (const key of ["location_type", "occupation_category", "education_level"]) {
      const values = new Map();
      for (const user of userData) {
        if (user[key]) {
          increment(values, String(user[key]));
        }
      }
      const top = mostCommon(values, 1)[0];
      if (top) {
        demographics[key] = top[0];
      }
    }

    const techScores = userData.filter((user) => typeof user.tech_proficiency === "number").map((user) => user.tech_proficiency);
    if (techScores.length) {
      const avgScore = techScores.reduce((sum, score) => sum + score, 0) / techScores.length;
      if (avgScore < 4) {
        demographics.tech_proficiency = "初级";
      } else if (avgScore < 7) {
        demographics.tech_proficiency = "中级";
      } else {
        demographics.tech_proficiency = "高级";
      }
    }

    return demographics;
  }

  extractPsychographics(patterns, interviews = null) {
    const motivations = [];
    const values = [];
    const attitudes = [];
    let lifestyle = "未提供";

    if (mapGet(patterns.usage_frequency, "daily") > 0) {
      motivations.push("效率", "稳定输出");
      values.push("节省时间");
    }

    if (mapGet(patterns.devices, "mobile") > mapGet(patterns.devices, "desktop")) {
      lifestyle = "移动办公、碎片化处理任务";
      values.push("灵活性");
    } else if (mapGet(patterns.contexts, "work") > 0) {
      lifestyle = "工作流驱动，偏向结果导向";
    }

    if (interviews) {
      for (const interview of interviews) {
        motivations.push(...(interview.motivations ?? []).filter(Boolean).map(String));
        values.push(...(interview.values ?? []).filter(Boolean).map(String));
        attitudes.push(...(interview.attitudes ?? []).filter(Boolean).map(String));
        if (lifestyle === "未提供" && interview.lifestyle) {
          lifestyle = String(interview.lifestyle);
        }
      }
    }

    return {
      motivations: dedupeKeepOrder(motivations).slice(0, 5),
      values: dedupeKeepOrder(values).slice(0, 5),
      attitudes: dedupeKeepOrder(attitudes).slice(0, 5),
      lifestyle,
    };
  }

  analyzeBehaviors(userData, patterns) {
    const usageCounter = new Map();
    for (const user of userData) {
      increment(usageCounter, String(user.usage_frequency ?? "weekly"));
    }
    const usagePatterns = mostCommon(usageCounter, 3).map(([label, count]) => rankedItem(label, count));
    const featurePreferences = mostCommon(patterns.feature_usage, 5).map(([feature, count]) => rankedItem(feature, count, "feature"));
    const avgFeatures = patterns.user_feature_counts.length
      ? patterns.user_feature_counts.reduce((sum, count) => sum + count, 0) / patterns.user_feature_counts.length
      : 0;

    let interactionStyle;
    let learningPreference;
    if (avgFeatures >= 5) {
      interactionStyle = "探索型，愿意使用多功能组合";
      learningPreference = "偏好快捷路径、批量操作和高级配置";
    } else if (avgFeatures >= 3) {
      interactionStyle = "熟悉型，围绕固定功能完成任务";
      learningPreference = "偏好明确指引和稳定布局";
    } else {
      interactionStyle = "保守型，只使用最短路径";
      learningPreference = "偏好低认知负担和即时反馈";
    }

    return {
      usage_patterns: usagePatterns,
      feature_preferences: featurePreferences,
      interaction_style: interactionStyle,
      learning_preference: learningPreference,
    };
  }

  identifyNeeds(patterns, interviews, archetype) {
    const template = this.archetypeTemplates[archetype];
    const primaryGoals = [...template.goals];
    const functionalNeeds = [];
    const emotionalNeeds = [
      "知道系统当前在做什么",
      "确认输入和结果不会丢失",
      "遇错时能快速恢复",
    ];

    if (mapGet(patterns.contexts, "work") > 0) {
      functionalNeeds.push("支持协作共享", "可追踪状态与结果");
    }
    if (mapGet(patterns.devices, "mobile") > 0) {
      functionalNeeds.push("移动端关键任务可闭环", "弱网下反馈明确");
    }
    if (mapGet(patterns.usage_frequency, "daily") > 0) {
      functionalNeeds.push("性能稳定", "减少重复输入");
    }

    const secondaryGoals = [];
    if (interviews) {
      for (const interview of interviews) {
        primaryGoals.push(...(interview.goals ?? []).filter(Boolean).map(String));
        secondaryGoals.push(...(interview.secondary_goals ?? []).filter(Boolean).map(String));
        functionalNeeds.push(...(interview.needs ?? []).filter(Boolean).map(String));
      }
    }

    return {
      primary_goals: dedupeKeepOrder(primaryGoals).slice(0, 4),
      secondary_goals: dedupeKeepOrder(secondaryGoals).slice(0, 3),
      functional_needs: dedupeKeepOrder(functionalNeeds).slice(0, 5),
      emotional_needs: emotionalNeeds,
    };
  }

  extractFrustrations(patterns, interviews, archetype) {
    const frustrationCounter = new Map(patterns.pain_points);
    if (interviews) {
      for (const interview of interviews) {
        for (const item of (interview.pain_points ?? []).filter(Boolean).map(String)) {
          increment(frustrationCounter, item);
        }
      }
    }

    if (frustrationCounter.size === 0) {
      for (const item of this.archetypeTemplates[archetype].frustrations) {
        increment(frustrationCounter, item);
      }
    }

    const results = mostCommon(frustrationCounter, 5).map(([issue, count]) => ({ issue, count }));
    if (results.length < 3) {
      for (const fallback of this.archetypeTemplates[archetype].frustrations) {
        if (results.some((item) => item.issue === fallback)) {
          continue;
        }
        results.push({ issue: fallback, count: 0 });
        if (results.length === 3) {
          break;
        }
      }
    }
    return results;
  }

  generateScenarios(archetype, patterns) {
    const [dominantContext] = maxEntry(patterns.contexts);
    const [dominantDevice] = maxEntry(patterns.devices);
    const scenarios = {
      power_user: [{
        title: "批量处理",
        context: `${dominantContext} 场景下要快速处理多条记录`,
        goal: "最少点击完成高频任务",
        steps: ["筛选数据", "执行批量操作", "确认结果"],
        pain_points: ["缺少快捷入口", "处理中无反馈"],
      }],
      casual_user: [{
        title: "一次性完成任务",
        context: `在 ${dominantContext} 场景里偶发使用系统`,
        goal: "无需学习也能走通主流程",
        steps: ["找到入口", "填写必要信息", "确认提交成功"],
        pain_points: ["标签含糊", "页面噪声过多"],
      }],
      business_user: [{
        title: "协作交付",
        context: "需要和同事共享状态与结果",
        goal: "把信息传递给团队并可回溯",
        steps: ["创建内容", "共享给团队", "追踪反馈与状态"],
        pain_points: ["权限规则不清", "缺少状态同步"],
      }],
      mobile_first: [{
        title: "移动端快处理",
        context: `主要通过 ${dominantDevice} 在碎片时间处理任务`,
        goal: "用最少输入完成关键操作",
        steps: ["打开入口", "完成核心动作", "确认已同步"],
        pain_points: ["触控区域小", "移动端功能不全"],
      }],
    };
    return scenarios[archetype];
  }

  selectQuote(interviews, archetype) {
    if (interviews) {
      for (const interview of interviews) {
        const quotes = (interview.quotes ?? []).filter(Boolean).map(String);
        if (quotes.length) {
          return quotes[0];
        }
      }
    }
    return this.archetypeTemplates[archetype].quote;
  }

  calculateDataPoints(userData, interviews) {
    const sampleSize = userData.length;
    let confidence;
    if (sampleSize >= 31) {
      confidence = "high";
    } else if (sampleSize >= 11) {
      confidence = "medium";
    } else {
      confidence = "low";
    }

    const sources = ["quantitative"];
    if (interviews?.length) {
      sources.push("qualitative");
    }
    return {
      sample_size: sampleSize,
      interview_count: interviews?.length ?? 0,
      confidence_level: confidence,
      validation_method: sources.join(" + "),
    };
  }

  deriveDesignImplications(patterns, archetype) {
    const implications = [];
    if (archetype === "power_user") {
      implications.push("优先优化批量路径和快捷操作", "减少重复输入与等待时间");
    }
    if (archetype === "casual_user") {
      implications.push("收敛首屏噪声，突出单一主路径", "用就地解释替代术语堆砌");
    }
    if (archetype === "business_user") {
      implications.push("补齐协作状态、权限和结果追踪", "让关键指标和导出能力可见");
    }
    if (archetype === "mobile_first") {
      implications.push("确保移动端关键任务闭环", "扩大触控区域并强化弱网反馈");
    }
    if (mapGet(patterns.pain_points, "slow loading") > 0) {
      implications.push("对高频页面补充骨架屏和明确状态反馈");
    }
    if (mapGet(patterns.pain_points, "confusing UI") > 0) {
      implications.push("重写含糊标签，统一导航命名");
    }
    return dedupeKeepOrder(implications).slice(0, 5);
  }

  formatPersonaOutput(persona) {
    const lines = [
      "=".repeat(60),
      `Persona：${persona.name}`,
      "=".repeat(60),
      `画像摘要：${persona.tagline}`,
      `原型：${persona.archetype}`,
      `代表性引语：${persona.quote}`,
      "",
      "人口属性：",
    ];

    for (const [key, value] of Object.entries(persona.demographics)) {
      lines.push(`  - ${key}: ${value}`);
    }

    lines.push("", "动机与价值：");
    if (persona.psychographics.motivations.length) {
      lines.push(`  - motivations: ${persona.psychographics.motivations.join(", ")}`);
    }
    if (persona.psychographics.values.length) {
      lines.push(`  - values: ${persona.psychographics.values.join(", ")}`);
    }
    if (persona.psychographics.lifestyle) {
      lines.push(`  - lifestyle: ${persona.psychographics.lifestyle}`);
    }

    lines.push("", "核心目标：");
    for (const goal of persona.needs_and_goals.primary_goals) {
      lines.push(`  - ${goal}`);
    }

    lines.push("", "主要痛点：");
    for (const issue of persona.frustrations) {
      const suffix = issue.count > 0 ? `（${issue.count} 次）` : "（模板补足）";
      lines.push(`  - ${issue.issue}${suffix}`);
    }

    lines.push("", "设计启发：");
    for (const item of persona.design_implications) {
      lines.push(`  - ${item}`);
    }

    lines.push(
      "",
      "数据置信度：",
      `  - sample_size: ${persona.data_points.sample_size}`,
      `  - interview_count: ${persona.data_points.interview_count}`,
      `  - confidence_level: ${persona.data_points.confidence_level}`,
    );
    return lines.join("\n");
  }
}

export function loadJsonList(path, label) {
  if (!existsSync(path)) {
    throw new Error(`${label} 文件不存在：${path}`);
  }
  const data = JSON.parse(readFileSync(path, "utf-8"));
  if (!Array.isArray(data)) {
    throw new Error(`${label} 必须是 JSON 数组。`);
  }
  return data;
}

export function createSampleUserData() {
  return Array.from({ length: 18 }, (_, index) => ({
    user_id: `user_${index}`,
    age: 24 + (index % 18),
    usage_frequency: ["daily", "weekly", "daily", "monthly"][index % 4],
    features_used: ["dashboard", "reports", "export", "share", "shortcuts"].slice(0, 2 + (index % 4)),
    primary_device: ["desktop", "desktop", "mobile", "tablet"][index % 4],
    usage_context: ["work", "work", "personal"][index % 3],
    tech_proficiency: 4 + (index % 5),
    location_type: ["urban", "urban", "suburban"][index % 3],
    occupation_category: ["operations", "design", "marketing"][index % 3],
    education_level: ["bachelor", "master"][index % 2],
    pain_points: ["slow loading", "confusing UI", "missing shortcuts"].slice(0, 1 + (index % 3)),
  }));
}

export function createSampleInterviews() {
  return [{
    quotes: ["如果系统不告诉我现在进展到哪一步，我会反复点按钮。"],
    motivations: ["效率", "确定性"],
    values: ["可靠反馈"],
    goals: ["减少返工", "快速确认结果"],
    needs: ["关键步骤要有即时反馈"],
    pain_points: ["status unclear", "confusing UI"],
  }];
}

function printUsage() {
  console.log(`Usage: node scripts/persona_generator.mjs [options] [json]

Options:
  --input <path>             User data JSON file; must be an array of objects
  --interviews <path>        Interview insights JSON file; must be an array of objects
  --output-format <format>   text or json (default: text)
  --sample                   Use built-in sample data
  --seed <number>            Stable naming seed (default: 7)
  -h, --help                 Show this help`);
}

function parseArgs(argv) {
  const args = {
    input: null,
    interviews: null,
    outputFormat: "text",
    sample: false,
    seed: 7,
    legacyOutputFormat: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      args.help = true;
      continue;
    }
    if (arg === "--sample") {
      args.sample = true;
      continue;
    }
    if (["--input", "--interviews", "--output-format", "--seed"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      index += 1;
      if (arg === "--input") {
        args.input = value;
      } else if (arg === "--interviews") {
        args.interviews = value;
      } else if (arg === "--output-format") {
        if (!["text", "json"].includes(value)) {
          throw new Error("argument --output-format: invalid choice");
        }
        args.outputFormat = value;
      } else {
        const seed = Number(value);
        if (!Number.isInteger(seed)) {
          throw new Error("argument --seed: invalid int value");
        }
        args.seed = seed;
      }
      continue;
    }
    if (arg === "json" && args.legacyOutputFormat == null) {
      args.legacyOutputFormat = "json";
      continue;
    }
    throw new Error(`unrecognized arguments: ${arg}`);
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`persona_generator.mjs: error: ${error.message}`);
    return 2;
  }

  if (args.help) {
    printUsage();
    return 0;
  }

  const outputFormat = args.legacyOutputFormat ?? args.outputFormat;

  try {
    let userData;
    let interviewData = [];
    if (args.sample) {
      userData = createSampleUserData();
      interviewData = createSampleInterviews();
    } else {
      if (!args.input) {
        console.error("persona_generator.mjs: error: 请使用 --input 指定用户数据 JSON，或使用 --sample 生成演示数据。");
        return 2;
      }
      userData = loadJsonList(args.input, "用户数据");
    }

    if (args.interviews) {
      interviewData = loadJsonList(args.interviews, "访谈洞察");
    }

    const generator = new PersonaGenerator(args.seed);
    const persona = generator.generatePersonaFromData(userData, interviewData);
    if (outputFormat === "json") {
      console.log(JSON.stringify(persona, null, 2));
    } else {
      console.log(generator.formatPersonaOutput(persona));
    }
    return 0;
  } catch (error) {
    console.error(`[persona_generator] ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
