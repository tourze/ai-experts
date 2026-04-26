import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/devops-expert");

const nodeScripts = [
  "skills/gh-address-comments/scripts/fetch_comments.mjs",
  "skills/gh-fix-ci/scripts/inspect_pr_checks.mjs",
];

test("DevOps Node scripts pass syntax checks", () => {
  for (const script of nodeScripts) {
    const result = spawnSync("node", ["--check", resolve(pluginRoot, script)], {
      encoding: "utf-8",
    });
    assert.equal(result.status, 0, `${script}\n${result.stderr}`);
  }
});

test("fetch_comments.mjs builds GraphQL args without null cursor variables", async () => {
  const mod = await import(resolve(pluginRoot, "skills/gh-address-comments/scripts/fetch_comments.mjs"));
  const args = mod.buildGraphqlArgs("octo", "repo", 42, {
    commentsCursor: "C1",
    reviewsCursor: null,
    threadsCursor: "T1",
  });

  assert.deepEqual(args.slice(0, 5), ["gh", "api", "graphql", "-F", "query=@-"]);
  assert.ok(args.includes("owner=octo"));
  assert.ok(args.includes("repo=repo"));
  assert.ok(args.includes("number=42"));
  assert.ok(args.includes("commentsCursor=C1"));
  assert.ok(args.includes("threadsCursor=T1"));
  assert.equal(args.some((arg) => arg.startsWith("reviewsCursor=")), false);
});

test("inspect_pr_checks.mjs extracts action run and job ids", async () => {
  const mod = await import(resolve(pluginRoot, "skills/gh-fix-ci/scripts/inspect_pr_checks.mjs"));
  const url = "https://github.com/o/r/actions/runs/123456/job/7890";

  assert.equal(mod.extractRunId(url), "123456");
  assert.equal(mod.extractJobId(url), "7890");
  assert.equal(mod.extractRunId("https://checks.example/build/1"), null);
});

test("inspect_pr_checks.mjs parses fallback fields and snippets failures", async () => {
  const mod = await import(resolve(pluginRoot, "skills/gh-fix-ci/scripts/inspect_pr_checks.mjs"));

  assert.deepEqual(mod.parseAvailableFields(`error
Available fields:
name
state
bucket
`), ["name", "state", "bucket"]);

  const snippet = mod.extractFailureSnippet("one\ntwo\nERROR: boom\nfour\nfive", 3, 1);
  assert.equal(snippet, "two\nERROR: boom");
  assert.equal(mod.isFailing({ bucket: "fail" }), true);
  assert.equal(mod.isFailing({ conclusion: "success", state: "completed" }), false);
});
