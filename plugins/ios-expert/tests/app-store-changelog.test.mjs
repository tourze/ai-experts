import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const script = resolve("plugins/ios-expert/skills/app-store-changelog/scripts/collect_release_changes.mjs");

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result;
}

function commitFile(repo, name, content, message) {
  writeFileSync(join(repo, name), content, "utf8");
  git(repo, ["add", name]);
  git(repo, ["commit", "-m", message]);
}

test("collect_release_changes.mjs reports changes since latest tag by default", () => {
  const repo = mkdtempSync(join(tmpdir(), "ios-release-"));
  try {
    git(repo, ["init"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["config", "user.name", "Test User"]);
    commitFile(repo, "README.md", "# demo\n", "initial release");
    git(repo, ["tag", "v1.0.0"]);
    commitFile(repo, "feature.txt", "visible change\n", "add visible feature");

    const result = spawnSync(process.execPath, [script], { cwd: repo, encoding: "utf8" });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Repo: /);
    assert.match(result.stdout, /Range: v1\.0\.0\.\.HEAD/);
    assert.match(result.stdout, /add visible feature/);
    assert.match(result.stdout, /feature\.txt/);
    assert.doesNotMatch(result.stdout, /initial release/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("collect_release_changes.mjs supports explicit empty ranges", () => {
  const repo = mkdtempSync(join(tmpdir(), "ios-release-empty-"));
  try {
    git(repo, ["init"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["config", "user.name", "Test User"]);
    commitFile(repo, "README.md", "# demo\n", "initial release");

    const result = spawnSync(process.execPath, [script, "HEAD", "HEAD"], { cwd: repo, encoding: "utf8" });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Range: HEAD\.\.HEAD/);
    assert.match(result.stdout, /== Commits ==\n\n\n== Files Touched ==/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
