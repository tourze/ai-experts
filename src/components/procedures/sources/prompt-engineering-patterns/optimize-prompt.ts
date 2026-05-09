#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
/**
 * Prompt Optimization Script
 *
 * Lightweight local demo for evaluating prompt variants, recording accuracy,
 * latency, token estimates, and selecting a better prompt from heuristic
 * variants. Uses only Node.js built-ins and the default MockLLMClient.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";

export const procedure = defineCliProcedure({
  id: "prompt-engineering-patterns-optimize-prompt",
  entry: procedureEntry(import.meta.url),
  description:
    "Prompt 优化演示脚本：使用内置示例对 prompt 变体进行精度、延迟、token 消耗的评估和迭代优化，输出优化结果 JSON。",
  owners: { skillIds: ["prompt-engineering-patterns"] },
  target: "scripts/optimize-prompt.mjs",
  runtime: "node",
  params: [
    {
      flag: "--output",
      type: "路径",
      description: "优化结果 JSON 输出路径（默认 optimization_results.json）",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的优化结果输出；仅在确认目标文件可替换后使用",
      required: false,
    },
  ],

  exampleArgs: { args: [] },
});

function percentile(values: any, pct: any): any {
  if (values.length === 0) {
    return 0.0;
  }
  const ordered = [...values].sort((a: any, b: any) => a - b);
  if (ordered.length === 1) {
    return ordered[0];
  }
  const rank = (pct / 100) * (ordered.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) {
    return ordered[lower];
  }
  const weight = rank - lower;
  return ordered[lower] + (ordered[upper] - ordered[lower]) * weight;
}
function mean(values: any): any {
  return (
    values.reduce((total: any, value: any) => total + value, 0) / values.length
  );
}
class TestCase {
  expectedOutput: any;
  input: any;
  metadata: any;
  constructor(input: any, expectedOutput: any, metadata: any = {}) {
    this.input = input;
    this.expectedOutput = expectedOutput;
    this.metadata = metadata;
  }
}
class PromptOptimizer {
  client: any;
  maxWorkers: any;
  resultsHistory: any;
  testSuite: any;
  constructor(llmClient: any, testSuite: any, maxWorkers: any = null) {
    this.client = llmClient;
    this.testSuite = [...testSuite];
    this.resultsHistory = [];
    this.maxWorkers =
      maxWorkers ?? Math.max(1, Math.min(8, this.testSuite.length || 1));
  }
  shutdown(): any {}
  evaluatePrompt(promptTemplate: any, testCases: any = null): any {
    const cases = testCases ?? this.testSuite;
    if (cases.length === 0) {
      return {
        avg_accuracy: 0.0,
        avg_latency: 0.0,
        p95_latency: 0.0,
        avg_tokens: 0.0,
        success_rate: 0.0,
      };
    }
    const metrics: Record<string, any> = {
      accuracy: [],
      latency: [],
      token_count: [],
      success_rate: [],
    };
    const results = cases.map((testCase: any) =>
      this.processTestCase(promptTemplate, testCase),
    );
    for (const result of results) {
      for (const [key, value] of Object.entries(result)) {
        metrics[key].push(value);
      }
    }
    return {
      avg_accuracy: mean(metrics.accuracy),
      avg_latency: mean(metrics.latency),
      p95_latency: percentile(metrics.latency, 95),
      avg_tokens: mean(metrics.token_count),
      success_rate: mean(metrics.success_rate),
    };
  }
  processTestCase(promptTemplate: any, testCase: any): any {
    const startedAt = performance.now();
    let accuracy = 0.0;
    let success = 0.0;
    let tokenCount = 0.0;
    try {
      const prompt = formatTemplate(promptTemplate, testCase.input);
      const response = this.client.complete(prompt);
      const responseText =
        response === null || response === undefined ? "" : String(response);
      accuracy = this.calculateAccuracy(responseText, testCase.expectedOutput);
      success = responseText ? 1.0 : 0.0;
      tokenCount =
        prompt.split(/\s+/).filter(Boolean).length +
        responseText.split(/\s+/).filter(Boolean).length;
    } catch {
      accuracy = 0.0;
      success = 0.0;
      tokenCount = 0.0;
    }
    const latency = (performance.now() - startedAt) / 1000;
    return {
      latency,
      token_count: tokenCount,
      success_rate: success,
      accuracy,
    };
  }
  calculateAccuracy(response: any, expected: any): any {
    const normalizedResponse = response.trim().toLowerCase();
    const normalizedExpected = expected.trim().toLowerCase();
    if (normalizedResponse === normalizedExpected) {
      return 1.0;
    }
    const responseWords = new Set(
      normalizedResponse.split(/\s+/).filter(Boolean),
    );
    const expectedWords = new Set(
      normalizedExpected.split(/\s+/).filter(Boolean),
    );
    if (expectedWords.size === 0) {
      return 0.0;
    }
    let overlap = 0;
    for (const word of responseWords) {
      if (expectedWords.has(word)) {
        overlap += 1;
      }
    }
    return overlap / expectedWords.size;
  }
  optimize(basePrompt: any, maxIterations: any = 5): any {
    let currentPrompt = basePrompt;
    let bestPrompt = basePrompt;
    let bestScore = 0.0;
    let currentMetrics: any = null;
    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      console.log(`\nIteration ${iteration + 1}/${maxIterations}`);
      const metrics = currentMetrics ?? this.evaluatePrompt(currentPrompt);
      console.log(
        `Accuracy: ${metrics.avg_accuracy.toFixed(2)}, Latency: ${metrics.avg_latency.toFixed(2)}s`,
      );
      this.resultsHistory.push({
        iteration,
        prompt: currentPrompt,
        metrics,
      });
      if (metrics.avg_accuracy > bestScore) {
        bestScore = metrics.avg_accuracy;
        bestPrompt = currentPrompt;
      }
      if (metrics.avg_accuracy > 0.95) {
        console.log("Achieved target accuracy!");
        break;
      }
      let bestVariation = currentPrompt;
      let bestVariationMetrics = metrics;
      let bestVariationScore = metrics.avg_accuracy;
      for (const variation of this.generateVariations(currentPrompt, metrics)) {
        const variationMetrics = this.evaluatePrompt(variation);
        if (variationMetrics.avg_accuracy > bestVariationScore) {
          bestVariation = variation;
          bestVariationMetrics = variationMetrics;
          bestVariationScore = variationMetrics.avg_accuracy;
        }
      }
      currentPrompt = bestVariation;
      currentMetrics = bestVariationMetrics;
      if (bestVariationScore > bestScore) {
        bestScore = bestVariationScore;
        bestPrompt = bestVariation;
      }
    }
    return {
      best_prompt: bestPrompt,
      best_score: bestScore,
      history: this.resultsHistory,
    };
  }
  generateVariations(prompt: any, currentMetrics: any): any {
    let variations: any[] = [
      `${prompt}\n\nProvide your answer in a clear, concise format.`,
      `Let's solve this step by step.\n\n${prompt}`,
      `${prompt}\n\nVerify your answer before responding.`,
    ];
    const concisePrompt = this.makeConcise(prompt);
    if (concisePrompt !== prompt) {
      variations.push(concisePrompt);
    }
    if (!prompt.toLowerCase().includes("example")) {
      variations.push(this.addExamples(prompt));
    }
    if ((currentMetrics.avg_accuracy ?? 0.0) >= 0.8) {
      variations = [...new Set(variations)].sort(
        (a: any, b: any) => a.length - b.length,
      );
    } else {
      variations = [
        ...new Map(
          variations.map((variation: any) => [variation, variation]),
        ).values(),
      ];
    }
    return variations.slice(0, 3);
  }
  makeConcise(prompt: any): any {
    const replacements: any[] = [
      ["in order to", "to"],
      ["due to the fact that", "because"],
      ["at this point in time", "now"],
      ["in the event that", "if"],
    ];
    let result = prompt;
    for (const [oldValue, newValue] of replacements) {
      result = result.split(oldValue).join(newValue);
    }
    return result;
  }
  addExamples(prompt: any): any {
    return `${prompt}

Example:
Input: Sample input
Output: Sample output
`;
  }
  comparePrompts(promptA: any, promptB: any): any {
    console.log("Testing Prompt A...");
    const metricsA = this.evaluatePrompt(promptA);
    console.log("Testing Prompt B...");
    const metricsB = this.evaluatePrompt(promptB);
    return {
      prompt_a_metrics: metricsA,
      prompt_b_metrics: metricsB,
      winner: metricsA.avg_accuracy > metricsB.avg_accuracy ? "A" : "B",
      improvement: Math.abs(metricsA.avg_accuracy - metricsB.avg_accuracy),
    };
  }
  exportResults(filename: any, overwrite: any = false): any {
    assertOutputWritable(filename, overwrite);
    const outputDir = dirname(filename);
    if (outputDir && outputDir !== ".") {
      mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(
      filename,
      JSON.stringify(this.resultsHistory, null, 2),
      "utf8",
    );
  }
}
export function assertOutputWritable(
  outputPath: any,
  overwrite: any = false,
): any {
  if (existsSync(outputPath) && !overwrite) {
    throw new Error(
      `output file already exists: ${outputPath}; pass --overwrite only after confirming it can be replaced`,
    );
  }
}
function formatTemplate(template: any, values: any): any {
  return template.replace(/\{([^{}]+)\}/g, (match: any, key: any) => {
    if (!(key in values)) {
      throw new Error(`Missing template value: ${key}`);
    }
    return String(values[key]);
  });
}
function usage(): any {
  return `Prompt optimization demo.

Usage: node scripts/optimize-prompt.mjs [options]

Options:
  --output <path>   Write optimization history JSON to this path (default: optimization_results.json)
  --overwrite       Replace an existing output file after confirmation
  --help            Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    output: "optimization_results.json",
    overwrite: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--overwrite") {
      args.overwrite = true;
      continue;
    }
    if (arg === "--output") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error("--output requires a value");
      }
      args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`unrecognized argument: ${arg}`);
  }
  return args;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const testSuite: any[] = [
    new TestCase({ text: "This movie was amazing!" }, "Positive"),
    new TestCase({ text: "Worst purchase ever." }, "Negative"),
    new TestCase({ text: "It was okay, nothing special." }, "Neutral"),
  ];
  const mockLlmClient: Record<string, any> = {
    complete(prompt: any) {
      const normalized = prompt.toLowerCase();
      if (normalized.includes("amazing")) {
        return "Positive";
      }
      if (normalized.includes("worst")) {
        return "Negative";
      }
      return "Neutral";
    },
  };
  const optimizer = new PromptOptimizer(mockLlmClient, testSuite);
  try {
    const basePrompt = "Classify the sentiment of: {text}\nSentiment:";
    const results = optimizer.optimize(basePrompt);
    console.log(`\n${"=".repeat(50)}`);
    console.log("Optimization Complete!");
    console.log(`Best Accuracy: ${results.best_score.toFixed(2)}`);
    console.log(`Best Prompt:\n${results.best_prompt}`);
    optimizer.exportResults(args.output, args.overwrite);
  } finally {
    optimizer.shutdown();
  }
}
