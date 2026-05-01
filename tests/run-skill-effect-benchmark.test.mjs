import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseCasesYaml,
  rubricToExpectations,
  buildRunRecord,
  buildContentEffectPrompt,
  runBenchmark,
} from "../scripts/run-skill-effect-benchmark.mjs";

describe("parseCasesYaml", () => {
  it("解析 pre-landing-review 形态的 cases.yaml", () => {
    const yaml = `cases:
  - id: pre_landing_check
    prompt: "Run a pre-landing review on my branch before I merge"
    fixtures: []
    rubric:
      - "loads checklist"
      - "produces verdict"
    trigger_expected: true

  - id: general_code_review
    prompt: "Review this code for quality"
    fixtures: []
    rubric:
      - "does not activate"
    trigger_expected: false
`;
    const { cases } = parseCasesYaml(yaml);
    assert.equal(cases.length, 2);
    assert.equal(cases[0].id, "pre_landing_check");
    assert.equal(cases[0].prompt, "Run a pre-landing review on my branch before I merge");
    assert.deepEqual(cases[0].rubric, ["loads checklist", "produces verdict"]);
    assert.equal(cases[0].trigger_expected, true);
    assert.equal(cases[1].trigger_expected, false);
  });
});

describe("rubricToExpectations", () => {
  it("把 rubric 字符串数组转为 schema 一致的 expectations，passed 预填 null", () => {
    const exp = rubricToExpectations(["a", "b"]);
    assert.deepEqual(exp, [
      { text: "a", passed: null, evidence: "" },
      { text: "b", passed: null, evidence: "" },
    ]);
  });

  it("空 rubric 返回空数组", () => {
    assert.deepEqual(rubricToExpectations(), []);
    assert.deepEqual(rubricToExpectations([]), []);
  });
});

describe("buildRunRecord", () => {
  it("产出 schema 一致的 run（与 skill-quality-report.collectEffectAudit 兼容）", () => {
    const record = buildRunRecord({
      skillId: "testing-expert/pre-landing-review",
      caseEntry: { id: "pre_landing_check", rubric: ["loads checklist"] },
      configuration: "with_skill",
      model: "gpt-5.4-mini",
      output: "命中 skill",
    });
    assert.equal(record.skill, "testing-expert/pre-landing-review");
    assert.equal(record.prompt_id, "pre_landing_check");
    assert.equal(record.configuration, "with_skill");
    assert.equal(record.model, "gpt-5.4-mini");
    assert.equal(record.output_excerpt, "命中 skill");
    assert.equal(record.expectations.length, 1);
    assert.equal(record.expectations[0].passed, null);
  });

  it("output_excerpt 会截断超长 executor 输出", () => {
    const record = buildRunRecord({
      skillId: "testing-expert/pre-landing-review",
      caseEntry: { id: "long_output", rubric: [] },
      configuration: "baseline",
      model: "gpt-test",
      output: "x".repeat(12_010),
    });
    assert.equal(record.output_excerpt.length < 12_100, true);
    assert.match(record.output_excerpt, /truncated 10 chars/);
  });
});

describe("buildContentEffectPrompt", () => {
  it("把 SKILL.md 显式注入 with_skill prompt", () => {
    const prompt = buildContentEffectPrompt({
      skillId: "demo-expert/demo-skill",
      skillMarkdown: "---\nname: demo-skill\n---\n# demo",
      userPrompt: "请审查这个方案",
    });
    assert.match(prompt, /<skill id="demo-expert\/demo-skill">/);
    assert.match(prompt, /name: demo-skill/);
    assert.match(prompt, /用户任务：\n请审查这个方案/);
  });
});

describe("runBenchmark", () => {
  it("用 stub executor 跑 with_skill+baseline，每个 trigger_expected 用例两次", async () => {
    const calls = [];
    const stubExecutor = ({ prompt, configuration, model, provider, comparison, loadUserConfig }) => {
      calls.push({ prompt, configuration, model, provider, comparison, loadUserConfig });
      return `${configuration}: ${prompt}`;
    };
    const cases = [
      { id: "c1", prompt: "p1", rubric: ["r1"], trigger_expected: true },
      { id: "c2", prompt: "p2", rubric: ["r2"], trigger_expected: true },
    ];
    const runs = await runBenchmark({
      skillId: "demo-expert/demo-skill",
      cases,
      model: "test-model",
      executor: stubExecutor,
    });
    assert.equal(runs.length, 4);
    assert.equal(calls.length, 4);
    const configurations = runs.map((r) => r.configuration).sort();
    assert.deepEqual(configurations, ["baseline", "baseline", "with_skill", "with_skill"]);
    assert.ok(runs.every((r) => r.skill === "demo-expert/demo-skill"));
    assert.ok(calls.filter((call) => call.configuration === "with_skill").every((call) => call.loadUserConfig === true));
    assert.ok(calls.filter((call) => call.configuration === "baseline").every((call) => call.loadUserConfig === false));
  });

  it("content comparison 对 with_skill 显式注入 skill，且两组都不加载用户配置", async () => {
    const calls = [];
    const cases = [{ id: "c1", prompt: "p1", rubric: ["r1"], trigger_expected: true }];
    const runs = await runBenchmark({
      skillId: "demo-expert/demo-skill",
      cases,
      provider: "claude",
      comparison: "content",
      skillMarkdown: "# demo skill",
      executor(args) {
        calls.push(args);
        return args.prompt;
      },
    });
    assert.equal(runs.length, 2);
    const withSkill = calls.find((call) => call.configuration === "with_skill");
    const baseline = calls.find((call) => call.configuration === "baseline");
    assert.match(withSkill.prompt, /# demo skill/);
    assert.equal(baseline.prompt, "p1");
    assert.equal(withSkill.loadUserConfig, false);
    assert.equal(baseline.loadUserConfig, false);
    assert.ok(runs.every((run) => run.provider === "claude"));
    assert.ok(runs.every((run) => run.comparison === "content"));
  });

  it("content comparison 缺少 skillMarkdown 时失败", async () => {
    await assert.rejects(
      () => runBenchmark({
        skillId: "demo-expert/demo-skill",
        cases: [{ id: "c1", prompt: "p1", rubric: ["r1"], trigger_expected: true }],
        comparison: "content",
        executor: () => "unused",
      }),
      /skillMarkdown is required/,
    );
  });

  it("跳过 trigger_expected: false 的反向用例（只用于路由审计，不衡量效果）", async () => {
    const stub = ({ configuration }) => configuration;
    const cases = [
      { id: "pos", prompt: "p", rubric: ["r"], trigger_expected: true },
      { id: "neg", prompt: "n", rubric: ["r"], trigger_expected: false },
    ];
    const runs = await runBenchmark({
      skillId: "demo/demo",
      cases,
      executor: stub,
    });
    assert.equal(runs.length, 2);
    assert.ok(runs.every((r) => r.prompt_id === "pos"));
  });

  it("dry-run 不调用 executor，输出占位 transcript", async () => {
    let called = false;
    const explode = () => {
      called = true;
      throw new Error("should not be called");
    };
    const runs = await runBenchmark({
      skillId: "demo/demo",
      cases: [{ id: "c1", prompt: "p1", rubric: ["r1"], trigger_expected: true }],
      executor: explode,
      dryRun: true,
    });
    assert.equal(called, false);
    assert.equal(runs.length, 2);
    assert.match(runs[0].output_excerpt, /^\[dry-run\]/);
  });

  it("executor 抛错时记 [executor error]，不中断后续 case", async () => {
    let count = 0;
    const flaky = () => {
      count += 1;
      if (count === 2) throw new Error("network down");
      return "ok";
    };
    const runs = await runBenchmark({
      skillId: "demo/demo",
      cases: [{ id: "c1", prompt: "p1", rubric: ["r"], trigger_expected: true }],
      executor: flaky,
    });
    assert.equal(runs.length, 2);
    assert.equal(runs[0].output_excerpt, "ok");
    assert.match(runs[1].output_excerpt, /\[executor error\] network down/);
  });
});
