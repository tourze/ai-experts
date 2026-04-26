import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";
import { GitHubAPI } from "../skills/repo-analyzer/scripts/github_api.mjs";

const script = resolve("plugins/research-expert/skills/repo-analyzer/scripts/github_api.mjs");

function mockFetch(routes) {
  return async (url) => {
    const parsed = new URL(String(url));
    const key = `${parsed.pathname}?${parsed.searchParams.toString()}`;
    const value = routes[key] ?? routes[parsed.pathname];
    if (value === undefined) {
      return {
        ok: false,
        status: 404,
        text: async () => "not found",
      };
    }
    return {
      ok: true,
      status: 200,
      text: async () => (typeof value === "string" ? value : JSON.stringify(value)),
      json: async () => value,
    };
  };
}

test("github_api.mjs passes syntax check", () => {
  const result = spawnSync("node", ["--check", script], { encoding: "utf-8" });
  assert.equal(result.status, 0, result.stderr);
});

test("GitHubAPI formats tree output", () => {
  const api = new GitHubAPI({ fetchImpl: mockFetch({}) });
  const output = api.formatTree({
    tree: [
      { path: "README.md", type: "blob" },
      { path: "src", type: "tree" },
      { path: "src/index.js", type: "blob" },
    ],
  });

  assert.equal(output, "README.md\nsrc/\n  index.js");
});

test("GitHubAPI summary uses mocked first-party responses", async () => {
  const api = new GitHubAPI({
    fetchImpl: mockFetch({
      "/repos/example/demo": {
        full_name: "example/demo",
        description: "demo repo",
        html_url: "https://github.com/example/demo",
        stargazers_count: 10,
        forks_count: 2,
        open_issues_count: 1,
        language: "JavaScript",
        license: { spdx_id: "MIT" },
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-02-01T00:00:00Z",
        pushed_at: "2024-03-01T00:00:00Z",
        default_branch: "main",
        topics: ["demo"],
      },
      "/repos/example/demo/languages": { JavaScript: 1000 },
      "/repos/example/demo/contributors?per_page=100": [{ login: "a" }, { login: "b" }],
      "/repos/example/demo/releases?per_page=1": [{ tag_name: "v1.0.0", name: "First", published_at: "2024-04-01T00:00:00Z" }],
    }),
  });

  const summary = await api.summarizeRepo("example", "demo");
  assert.equal(summary.name, "example/demo");
  assert.deepEqual(summary.languages, { JavaScript: 1000 });
  assert.equal(summary.contributor_count, 2);
  assert.deepEqual(summary.latest_release, {
    tag: "v1.0.0",
    name: "First",
    date: "2024-04-01T00:00:00Z",
  });
});
